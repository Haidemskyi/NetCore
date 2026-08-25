'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Language = 'en' | 'ru';

export default function PrivacyContent() {
  const [lang, setLang] = useState<Language>('en');

  const content = {
    en: {
      title: 'Privacy Policy',
      subtitle: 'NETCORE CRM — Employee & Fleet Management Platform',
      lastUpdated: 'Last Updated: July 21, 2026',
      backToApp: 'Back to Sign In',
      tableOfContents: 'Table of Contents',
      sections: [
        {
          id: 'overview',
          title: '1. Overview & General Information',
          text: `This Privacy Policy governs the collection, use, and protection of personal data by NETCORE CRM ("we", "our", or "us"), accessible via https://crm.qwartz.net and associated mobile applications.

NETCORE CRM is an enterprise employee and fleet management system designed to coordinate logistics, driver routes, vehicle inspections, and task management. By using our service or mobile application, you agree to the collection and use of information in accordance with this policy.`
        },
        {
          id: 'data-collected',
          title: '2. Information We Collect',
          text: `To provide fleet management and workforce scheduling services, we collect the following categories of data:`,
          list: [
            'Account & Identity Information: User name, login credentials, employee ID, phone number, and assigned organization/role.',
            'Location Data (Foreground & Background): Precise GPS location data collected while using the app or while active during work shifts.',
            'Photos & Camera Data: Vehicle inspection images, fuel receipt uploads, document scans, and task verification photos provided by the user.',
            'Device & Diagnostics: Device hardware model, operating system version, app version, unique device identifiers, IP address, and crash reports.'
          ]
        },
        {
          id: 'location-policy',
          title: '3. Location Data & Background Tracking',
          badge: 'Important for Mobile App Users',
          text: `NETCORE CRM collects precise location data (GPS coordinates, speed, heading) to enable live fleet tracking, route optimization, distance calculation, and job dispatching.

• Foreground Location: Tracked while the app is active on screen during work tasks.
• Background Location: Tracked when enabled during active shift hours, even when the app is closed or not in use, to ensure continuous safety monitoring, accurate route logging, and real-time dispatch updates.

We DO NOT track location outside of active work duties or for any advertising purposes. Location tracking can be paused by ending your active shift in the app or disabling location permissions in your device settings (note: disabling location may limit operational features).`
        },
        {
          id: 'camera-media',
          title: '4. Camera & Media Usage',
          text: `The mobile application requests permission to access your device camera and photo library exclusively for operational tasks, including:

• Capturing vehicle pre-trip and post-trip inspection photos.
• Uploading maintenance, damage, or incident reports.
• Scanning or attaching work orders and delivery receipts.

Photos are uploaded securely to NETCORE CRM servers and associated with your work log.`
        },
        {
          id: 'use-of-data',
          title: '5. How We Use Your Data',
          text: `We process the collected data strictly for internal operational purposes:

• Managing fleet logistics, driver routes, and task assignments.
• Authenticating user access and securing employee accounts.
• Calculating mileage, shift duration, and job completion reports.
• Technical support, app diagnostics, and service reliability improvements.`
        },
        {
          id: 'data-sharing',
          title: '6. Data Sharing & Third Parties',
          text: `We prioritize user privacy and data security. 

• No Advertising: We do NOT sell, rent, or monetize your personal or location data to third parties or advertising networks.
• Infrastructure & Service Providers: Data may be processed by trusted infrastructure partners (such as hosting, network security, and database providers including Cloudflare) strictly to host and run the service.
• Legal Requirements: We may disclose data if required by applicable law, regulation, or legal process.`
        },
        {
          id: 'security-retention',
          title: '7. Security & Data Retention',
          text: `• Security: All data transmissions are encrypted using standard HTTPS/TLS protocols. Access to stored data is restricted to authorized company administrators.
• Retention: We retain user data for as long as the employee account is active or as required by the organization for operational audit and legal record-keeping.`
        },
        {
          id: 'user-rights',
          title: '8. User Rights & Account Deletion',
          text: `Users have the right to:

• Access, review, and request corrections to their personal profile data.
• Revoke app permissions (Location, Camera, Notifications) at any time via device settings.
• Request account deletion and removal of personal data. To initiate account or data deletion, contact your organization administrator or email us at support@qwartz.net.`
        },
        {
          id: 'contact',
          title: '9. Contact Information',
          text: `If you have any questions, concerns, or requests regarding this Privacy Policy or data processing, please contact us:

• Service: NETCORE CRM Platform
• Website: https://crm.qwartz.net
• Email: support@qwartz.net`
        }
      ]
    },
    ru: {
      title: 'Политика конфиденциальности',
      subtitle: 'NETCORE CRM — Платформа управления сотрудниками и автопарком',
      lastUpdated: 'Дата последнего обновления: 21 июля 2026 г.',
      backToApp: 'Вернуться ко входу',
      tableOfContents: 'Содержание',
      sections: [
        {
          id: 'overview',
          title: '1. Общие положения',
          text: `Настоящая Политика конфиденциальности регулирует порядок сбора, использования и защиты персональных данных системой NETCORE CRM («мы», «наш»), доступной по адресу https://crm.qwartz.net и в мобильном приложении.

NETCORE CRM — это корпоративная система управления автопарком и персоналом, предназначенная для координации логистики, маршрутов водителей, техосмотра и задач. Используя сервис или мобильное приложение, вы соглашаетесь со сбором и использованием информации в соответствии с данной политикой.`
        },
        {
          id: 'data-collected',
          title: '2. Собираемая информация',
          text: `Для обеспечения работы сервисов управления автопарком и сменной деятельностью мы собираем следующие категории данных:`,
          list: [
            'Учетные данные и идентификация: имя пользователя, логин, ID сотрудника, номер телефона, должность и привязанная организация.',
            'Данные о геолокации (в фоновом и активном режиме): точные GPS-координаты, собираемые во время использования приложения и выполнения рабочих смен.',
            'Фотографии и доступ к камере: снимки техосмотра транспорта, чеков за топливо, путевых листов и фотоотчетов по задачам.',
            'Технические данные устройства: модель устройства, версия ОС, версия приложения, уникальные идентификаторы устройства, IP-адрес и отборы сбоев.'
          ]
        },
        {
          id: 'location-policy',
          title: '3. Использование геолокации и фоновый трекинг',
          badge: 'Важно для пользователей мобильного приложения',
          text: `NETCORE CRM собирает точные данные о местоположении (координаты GPS, скорость, направление), чтобы обеспечивать отслеживание автопарка в реальном времени, оптимизацию маршрутов, расчет километража и назначение задач.

• Геолокация в активном режиме: отслеживается, когда приложение открыто на экране во время смены.
• Геолокация в фоновом режиме: отслеживается во время активной рабочей смены, даже когда приложение свернуто или закрыто, для непрерывного мониторинга безопасности и обновления статуса рейсов.

Мы НЕ отслеживаем местоположение вне рабочих смен и НЕ используем геолокацию в рекламных целях. Вы можете приостановить отслеживание, завершив смену в приложении или отключив разрешение на геолокацию в настройках устройства.`
        },
        {
          id: 'camera-media',
          title: '4. Использование камеры и медиафайлов',
          text: `Мобильное приложение запрашивает доступ к камере и галерее устройства исключительно для выполнения рабочих функций:

• Фотофиксация состояния транспортного средства перед выездом и после смены.
• Загрузка отчетов о повреждениях, ремонтах и расходах.
• Прикрепление накладных и подтверждающих документов.

Все фотографии надежно передаются на серверы NETCORE CRM и связываются с вашим рабочим журналом.`
        },
        {
          id: 'use-of-data',
          title: '5. Цели использования данных',
          text: `Собраные данные используются исключительно для внутренних операционных целей компании:

• Управление логистикой автопарка, маршрутами и задачами сотрудников.
• Аутентификация пользователей и защита учетных записей.
• Расчет пробега, продолжительности смен и формирования отчетов.
• Техническая поддержка, диагностика и повышение стабильности работы приложения.`
        },
        {
          id: 'data-sharing',
          title: '6. Передача данных и третьим лицам',
          text: `Мы серьезно относимся к защите персональных данных:

• Без рекламы: мы НЕ продаем, не передаем и не монетизируем ваши персональные данные или геолокацию сторонним рекламным сетям.
• Инфраструктурные провайдеры: данные могут обрабатываться надежными облачными сервисами (хостинг, защита сети Cloudflare) исключительно для обеспечения функционирования системы.
• Законодательные требования: данные могут быть раскрыты только в случаях, предусмотренных действующим законодательством.`
        },
        {
          id: 'security-retention',
          title: '7. Безопасность и хранение данных',
          text: `• Безопасность: передача данных защищена современными протоколами шифрования HTTPS/TLS. Доступ к хранящимся данным ограничен авторизованными администраторами компании.
• Сроки хранения: данные хранятся в течение срока активности учетной записи сотрудника или периода, необходимого компании для операционного аудита.`
        },
        {
          id: 'user-rights',
          title: '8. Права пользователей и удаление данных',
          text: `Пользователи имеют право:

• Просматривать и запрашивать исправление своих персональных данных.
• В любой момент отозвать разрешения приложения (геолокация, камера) в настройках смартфона.
• Запросить удаление учетной записи и персональных данных. Для удаления аккаунта обратитесь к администратору вашей компании или напишите нам по адресу support@qwartz.net.`
        },
        {
          id: 'contact',
          title: '9. Контактная информация',
          text: `Если у вас есть вопросы или обращения по поводу данной Политики конфиденциальности, свяжитесь с нами:

• Сервис: Платформа NETCORE CRM
• Сайт: https://crm.qwartz.net
• Email: support@qwartz.net`
        }
      ]
    }
  };

  const current = content[lang];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-white selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 font-black flex items-center justify-center text-sm shadow-md group-hover:bg-zinc-200 transition-all">
                N
              </div>
              <span className="font-black tracking-tight text-white text-lg">NETCORE CRM</span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#18181b] border border-zinc-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  lang === 'ru'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Русский
              </button>
            </div>

            <Link
              href="/"
              className="hidden sm:inline-flex text-xs font-semibold bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3.5 py-2 rounded-lg transition-all"
            >
              {current.backToApp}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Title Section */}
        <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6 sm:p-10 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="inline-block px-3 py-1 bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-mono font-medium rounded-full mb-4">
            {current.lastUpdated}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            {current.title}
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-medium">
            {current.subtitle}
          </p>

          {/* Quick Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800">
            <div className="bg-[#09090b] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Location</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">Shift Duty Tracking</div>
            </div>
            <div className="bg-[#09090b] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Camera</div>
              <div className="text-xs font-bold text-sky-400 mt-0.5">Inspections & Media</div>
            </div>
            <div className="bg-[#09090b] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Security</div>
              <div className="text-xs font-bold text-purple-400 mt-0.5">TLS / Encrypted</div>
            </div>
            <div className="bg-[#09090b] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Third Parties</div>
              <div className="text-xs font-bold text-zinc-200 mt-0.5">No Ad Data Sale</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of contents sidebar */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 bg-[#18181b] border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">
                {current.tableOfContents}
              </div>
              {current.sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block text-zinc-400 hover:text-white transition-colors truncate py-1 border-l-2 border-transparent hover:border-white pl-2"
                >
                  {sec.title}
                </a>
              ))}
            </div>
          </aside>

          {/* Policy Text Content */}
          <div className="lg:col-span-3 space-y-6">
            {current.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 shadow-sm scroll-mt-24 transition-all hover:border-zinc-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {section.title}
                  </h2>
                  {section.badge && (
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      {section.badge}
                    </span>
                  )}
                </div>

                <div className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal space-y-3">
                  <p>{section.text}</p>

                  {section.list && (
                    <ul className="list-disc list-inside space-y-2 pt-1 pl-1 text-zinc-300">
                      {section.list.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            {/* Footer note */}
            <div className="text-center pt-8 text-xs text-zinc-500 space-y-2">
              <p>© {new Date().getFullYear()} NETCORE CRM. All rights reserved.</p>
              <p>
                <Link href="/" className="underline hover:text-zinc-300">
                  https://crm.qwartz.net
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
