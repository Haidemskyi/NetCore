import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import crypto from 'crypto';

// Force Node.js to prefer IPv4 globally — prevents ENETUNREACH on VPS without IPv6
dns.setDefaultResultOrder('ipv4first');

function getEnvVariable(key: string): string | undefined {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const parts = trimmed.split('=');
          const currentKey = parts[0].trim();
          if (currentKey === key) {
            let value = parts.slice(1).join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            return value;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading .env file manually:', err);
  }
  return process.env[key];
}

export async function POST(req: Request) {
  try {
    const { candidateId, templateType, stateCode, customSubject, customBody, previewOnly, selectedProviders, companyCutPercent, perDiemOverride } = await req.json();

    if (!candidateId || !templateType) {
      return NextResponse.json({ error: 'Missing candidateId or templateType' }, { status: 400 });
    }

    // Fetch candidate details
    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(candidateId) },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    let subject = customSubject || '';
    let bodyHtml = customBody || '';
    let bodyText = '';

    const targetStateCode = (stateCode || candidate.stateCode || 'TN').toUpperCase();
    const stateObj = await prisma.state.findUnique({
      where: { code: targetStateCode },
    });
    const stateName = stateObj ? stateObj.name : targetStateCode;

    // Available providers for this state
    const allStateRates = await prisma.ratePlan.findMany({
      where: { stateCode: targetStateCode },
      select: { provider: true },
    });
    const availableProviders = Array.from(new Set(allStateRates.map((r) => r.provider).filter(Boolean)));

    let activeSelectedProviders: string[] = availableProviders;
    if (Array.isArray(selectedProviders) && selectedProviders.length > 0) {
      activeSelectedProviders = selectedProviders.filter((p) => availableProviders.includes(p));
      if (activeSelectedProviders.length === 0) {
        activeSelectedProviders = availableProviders;
      }
    }

    // Get attachments list for signature request
    let attachmentsNames: string[] = [];
    if (templateType === 'DOCS_SIGNING') {
      const documentsDir = path.join(process.cwd(), 'Documents');
      if (fs.existsSync(documentsDir)) {
        attachmentsNames = fs.readdirSync(documentsDir);
      }
    }

    // Generate templates if custom subject/body are not provided
    if (!customSubject || !customBody) {
      if (templateType === 'RATES') {
        const isSingleProvider = activeSelectedProviders.length === 1;
        if (isSingleProvider) {
          subject = `Rates for ${stateName} (${activeSelectedProviders[0]}) - NETCORE CRM`;
        } else {
          subject = `Rates for ${stateName} - NETCORE CRM`;
        }
        
        // Fetch rate plans for the state filtered by selected providers
        const rates = await prisma.ratePlan.findMany({
          where: {
            stateCode: targetStateCode,
            provider: { in: activeSelectedProviders },
          },
          orderBy: [{ provider: 'asc' }, { code: 'asc' }],
        });

        const companyCut = companyCutPercent !== undefined && companyCutPercent !== null && companyCutPercent !== ''
          ? Number(companyCutPercent)
          : null;

        let ratesRows = '';
        let ratesText = '';
        if (rates.length === 0) {
          ratesRows = '<tr><td colspan="4" style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #71717a;">No rates set for selected provider(s).</td></tr>';
          ratesText = 'No rates defined for selected provider(s).';
        } else {
          rates.forEach((r) => {
            let calculatedPrice = Number(r.employeePrice);
            if (companyCut !== null && !isNaN(companyCut) && Number(r.grossPrice) > 0) {
              calculatedPrice = Number(r.grossPrice) * ((100 - companyCut) / 100);
            }
            ratesRows += `
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${r.provider}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569; font-family: monospace;">${r.code}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">${r.description}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #059669; text-align: right;">$${calculatedPrice.toFixed(2)}</td>
              </tr>
            `;
            ratesText += `- ${r.provider} (${r.code}) [${r.description}]: $${calculatedPrice.toFixed(2)}\n`;
          });
        }

        let activePerDiem = stateObj ? Number(stateObj.employeePerDiem) : 0;
        if (perDiemOverride !== undefined && perDiemOverride !== null && perDiemOverride !== '') {
          activePerDiem = Number(perDiemOverride);
        }

        let perDiemHtml = '';
        let perDiemText = '';
        if (activePerDiem > 0) {
          const formattedPerDiem = activePerDiem.toFixed(2);
          perDiemHtml = `
            <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">
                💰 Tech Daily Per Diem Allowance: $${formattedPerDiem} / day
              </p>
            </div>
          `;
          perDiemText = `Tech Daily Per Diem Allowance: $${formattedPerDiem} / day\n\n`;
        }

        bodyHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #334155;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #1e3a8a; font-size: 22px;">NETCORE CRM</h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Regional Technician Rate Sheet — ${stateName}</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hello <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
            
            <p style="font-size: 15px; line-height: 1.6;">We are pleased to share the job rates for the state of <strong>${stateName}</strong>. Below is the current pricing list for technicians in this region:</p>
            
            ${perDiemHtml}
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 12px 10px; border: 1px solid #e2e8f0; text-align: left; color: #334155; font-weight: 600;">Provider</th>
                  <th style="padding: 12px 10px; border: 1px solid #e2e8f0; text-align: left; color: #334155; font-weight: 600;">Code</th>
                  <th style="padding: 12px 10px; border: 1px solid #e2e8f0; text-align: left; color: #334155; font-weight: 600;">Description</th>
                  <th style="padding: 12px 10px; border: 1px solid #e2e8f0; text-align: right; color: #334155; font-weight: 600;">Your Rate</th>
                </tr>
              </thead>
              <tbody>
                ${ratesRows}
              </tbody>
            </table>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">If you have any questions regarding these rates or wish to proceed with your onboarding, please reply directly to this email.</p>
            
            <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
              <p style="margin: 0; font-weight: 600;">Best regards,</p>
              <p style="margin: 4px 0 0 0;">NETCORE CRM Recruiting Team</p>
            </div>
          </div>
        `;

        bodyText = `Hello ${candidate.firstName} ${candidate.lastName},\n\nWe are pleased to share the job rates for the state of ${stateName}. Below is the current pricing list for technicians in this region:\n\n${ratesText}\n${perDiemText}If you have any questions about these rates or would like to move forward, please let us know.\n\nBest regards,\nNETCORE CRM Recruiting Team`;
      } else if (templateType === 'DOCS_REQUEST') {
        subject = `Initiate Onboarding Process — NETCORE CRM`;

        // Always generate a fresh upload token for candidate
        const uploadToken = crypto.randomBytes(24).toString('hex');
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            uploadToken,
            uploadExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            uploadCompleted: false,
          },
        });

        const hostHeader = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const originUrl = hostHeader ? `${protocol}://${hostHeader}` : null;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || originUrl || 'http://localhost:3000';
        const uploadUrl = `${baseUrl}/upload/${uploadToken}`;

        bodyHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #334155;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #1e3a8a; font-size: 22px;">NETCORE CORPORATION</h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Onboarding Process</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
            
            <p style="font-size: 15px; line-height: 1.6;">To initiate your Onboarding Process and issue your agreements, please click the secure link below to upload your 6 required verification documents:</p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${uploadUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                Upload Onboarding Documents
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; font-weight: 600;">Required Verification Documents Checklist (6 Items):</p>
            <ol style="font-size: 14px; line-height: 1.8; padding-left: 20px; color: #1e293b;">
              <li><strong>Driver's License — Front Side</strong></li>
              <li><strong>Driver's License — Back Side</strong></li>
              <li><strong>Social Security Card (SSN)</strong></li>
              <li><strong>Employment Authorization Document (EAD) — Front Side</strong></li>
              <li><strong>Employment Authorization Document (EAD) — Back Side</strong></li>
              <li><strong>Official ID Badge Photo</strong> (Portrait photo taken on clean white background)</li>
            </ol>
            
            <p style="font-size: 13px; color: #94a3b8; font-style: italic; margin-top: 20px;">Or copy and paste this secure link into your browser: <br/><a href="${uploadUrl}" style="color: #2563eb;">${uploadUrl}</a></p>
            
            <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
              <p style="margin: 0; font-weight: 600;">Best regards,</p>
              <p style="margin: 4px 0 0 0;">NETCORE Corporation Recruiting & Compliance Team</p>
            </div>
          </div>
        `;

        bodyText = `Dear ${candidate.firstName} ${candidate.lastName},\n\nTo initiate your Onboarding Process, please click the secure link below to upload your 6 required verification documents:\n\n${uploadUrl}\n\nRequired Verification Documents Checklist:\n1. Driver's License — Front Side\n2. Driver's License — Back Side\n3. Social Security Card (SSN)\n4. Employment Authorization Document (EAD) — Front Side\n5. Employment Authorization Document (EAD) — Back Side\n6. Official ID Badge Photo (Portrait photo on white background)\n\nBest regards,\nNETCORE Corporation Recruiting Team`;
      } else if (templateType === 'DOCS_SIGNING') {
        subject = `Agreements for Signature - NETCORE CRM`;

        // Ensure candidate has a signing token
        let signingToken = candidate.signingToken;
        if (!signingToken) {
          signingToken = crypto.randomBytes(24).toString('hex');
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: {
              signingToken,
              signingExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }

        let docsListHtml = '<li><strong>Example Document</strong></li>';
        let docsListText = '- Example Document';

        const documentsDir = path.join(process.cwd(), 'Documents');
        if (fs.existsSync(documentsDir)) {
          const files = fs.readdirSync(documentsDir);
          if (files.length > 0) {
            docsListHtml = files.map(file => `<li><strong>${file.replace(/\.[^/.]+$/, '')}</strong></li>`).join('\n');
            docsListText = files.map(file => `- ${file.replace(/\.[^/.]+$/, '')}`).join('\n');
          }
        }

        bodyHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #334155;">
            <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #1e3a8a; font-size: 22px;">NETCORE CRM</h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Onboarding Documents & Signature Request</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hello <strong>${candidate.firstName}</strong>,</p>
            
            <p style="font-size: 15px; line-height: 1.6;">Please find attached the 4 required onboarding PDF forms for your review and signature:</p>
            
            <ul style="font-size: 15px; line-height: 1.8; padding-left: 20px; color: #1e293b;">
              ${docsListHtml}
            </ul>

            <p style="font-size: 15px; line-height: 1.6;">Please review, fill out, and sign these 4 attached PDF documents. Once signed, please reply directly to this email with your completed documents attached.</p>
            
            <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
              <p style="margin: 0; font-weight: 600;">Best regards,</p>
              <p style="margin: 4px 0 0 0;">NETCORE CRM Onboarding Team</p>
            </div>
          </div>
        `;

        bodyText = `Hello ${candidate.firstName},\n\nPlease find attached the 4 required onboarding PDF forms for your review and signature:\n\n${docsListText}\n\nPlease review, fill out, and sign these 4 attached PDF documents. Once signed, please reply directly to this email with your completed documents attached.\n\nBest regards,\nNETCORE CRM Onboarding Team`;
      }
    } else {
      // If custom subject and custom body HTML are provided, use simple HTML strip to construct bodyText
      bodyText = bodyHtml.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n');
    }

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        candidate,
        emailDetails: {
          to: candidate.email,
          subject: subject,
          bodyHtml: bodyHtml,
          bodyText: bodyText,
          attachments: attachmentsNames,
          availableProviders: availableProviders,
          selectedProviders: activeSelectedProviders,
        },
      });
    }

    // Outbound variables
    const n8nWebhook = getEnvVariable('N8N_WEBHOOK_URL');
    const smtpHost = getEnvVariable('SMTP_HOST');
    const smtpPort = Number(getEnvVariable('SMTP_PORT') || '587');
    const smtpUser = getEnvVariable('SMTP_USER');
    const smtpPass = getEnvVariable('SMTP_PASS');
    const smtpFrom = getEnvVariable('SMTP_FROM') || 'netcore.corporation@gmail.com';

    let sent = false;
    let logMessage = '';

    console.log('[EMAIL] n8nWebhook configured URL:', n8nWebhook);
    if (n8nWebhook) {
      try {
        const payload: any = {
          candidateId,
          templateType,
          to: candidate.email,
          subject: subject,
          bodyHtml: bodyHtml,
          bodyText: bodyText,
          attachments: []
        };

        if (templateType === 'DOCS_SIGNING') {
          const documentsDir = path.join(process.cwd(), 'Documents');
          if (fs.existsSync(documentsDir)) {
            const files = fs.readdirSync(documentsDir);
            payload.attachments = files.map(file => {
              const filePath = path.join(documentsDir, file);
              const contentBase64 = fs.readFileSync(filePath).toString('base64');
              return {
                filename: file,
                content: contentBase64,
                contentType: 'application/pdf'
              };
            });
          }
        }

        console.log(`[EMAIL] Sending POST to n8n at ${n8nWebhook}...`);
        const response = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify(payload)
        });
        console.log(`[EMAIL] n8n responded with status: ${response.status}`);

        if (response.ok) {
          sent = true;
          logMessage = `Email sent successfully!`;
        } else {
          logMessage = `Email sending failed (status code ${response.status}).`;
        }
      } catch (err: any) {
        console.error('[EMAIL] n8n webhook error, falling back:', err);
        logMessage = `Email sending failed: ${err.message}`;
      }
    } else {
      console.log('[EMAIL] n8nWebhook is NOT defined, skipping webhook step.');
    }

    // Fallback to SMTP if webhook not used or failed
    if (!sent && smtpHost && smtpUser && smtpPass) {
      try {
        // Resolve SMTP Host to IPv4 if it's a domain name to prevent ENETUNREACH on systems without IPv6 routing
        let resolvedHost = smtpHost;
        const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(smtpHost) || smtpHost.includes(':');
        if (!isIP) {
          try {
            const addresses = await new Promise<string[]>((resolve, reject) => {
              dns.resolve4(smtpHost, (err, addresses) => {
                if (err) reject(err);
                else resolve(addresses);
              });
            });
            if (addresses && addresses.length > 0) {
              resolvedHost = addresses[0];
              console.log(`Resolved SMTP host ${smtpHost} to IPv4 address ${resolvedHost}`);
            }
          } catch (dnsErr) {
            console.error('DNS IPv4 resolution failed, using original SMTP host:', dnsErr);
          }
        }

        const transporter = nodemailer.createTransport({
          host: resolvedHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          family: 4,
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000,
          tls: {
            servername: smtpHost,
            rejectUnauthorized: false,
          },
        } as any);

        const mailOptions: any = {
          from: smtpFrom,
          to: candidate.email,
          subject: subject,
          html: bodyHtml,
        };

        // If templateType is signing, attach files from Documents/ folder
        if (templateType === 'DOCS_SIGNING') {
          const documentsDir = path.join(process.cwd(), 'Documents');
          if (fs.existsSync(documentsDir)) {
            const files = fs.readdirSync(documentsDir);
            mailOptions.attachments = files.map((file) => ({
              filename: file,
              path: path.join(documentsDir, file),
            }));
          }
        }

        await transporter.sendMail(mailOptions);

        sent = true;
        logMessage = `Email sent successfully!`;
      } catch (err: any) {
        console.error('SMTP Send Error, falling back to log simulation:', err);
        logMessage = `Email simulated instead.`;
      }
    } else if (!sent) {
      logMessage = `Email simulated (no active email settings).`;
    }

    // Log the generated email details to terminal console for transparency
    console.log('--- EMAIL OUTBOX DISPATCH ---');
    console.log(`To: ${candidate.email}`);
    console.log(`Subject: ${subject}`);
    if (attachmentsNames.length > 0) {
      console.log(`Attachments: ${attachmentsNames.join(', ')}`);
    }
    console.log(`Body (Snippet): ${bodyHtml.replace(/<[^>]*>/g, ' ').substring(0, 300)}...`);
    console.log('-----------------------------');

    // Update candidate status based on templateType
    let newStatus = candidate.status;
    if (templateType === 'RATES') {
      newStatus = 'RATES_SENT';
    } else if (templateType === 'DOCS_REQUEST') {
      newStatus = 'DOCS_REQUESTED';
    } else if (templateType === 'DOCS_SIGNING') {
      newStatus = 'SIGNING_SENT';
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      sent: sent,
      simulated: !sent,
      logMessage: logMessage,
      candidate: updatedCandidate,
      emailDetails: {
        to: candidate.email,
        subject: subject,
        bodyHtml: bodyHtml,
        bodyText: bodyText,
        attachments: attachmentsNames,
        availableProviders: availableProviders,
        selectedProviders: activeSelectedProviders,
      },
    });
  } catch (error: any) {
    console.error('Error in send email route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
