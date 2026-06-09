import os

def main():
    filepath = "src/app/page.tsx"
    with open(filepath, "rb") as f:
        raw_bytes = f.read()
    
    # Normalize to unix line endings for search and replace
    content = raw_bytes.replace(b"\r\n", b"\n").decode("utf-8")

    # 1. Update admins state type definition
    old_admins_state = "  const [admins, setAdmins] = useState<{username: string; password: string}[]>([]);"
    new_admins_state = "  const [admins, setAdmins] = useState<{username: string}[]>([]);"
    
    # 2. Login, logout, register handlers
    old_auth = """  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUsername.trim().toLowerCase();
    const p = loginPassword;

    const matched = admins.find(admin => admin.username === u && admin.password === p);
    if (matched) {
      setIsLoggedIn(true);
      setCurrentUser(u);
      setLoginError('');
      if (typeof window !== 'undefined') {
        localStorage.setItem('netcore_session', u);
      }
    } else {
      setLoginError('Invalid login or password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('netcore_session');
    }
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const newUsername = inviteForm.username.trim().toLowerCase();
    const newPassword = inviteForm.password;

    if (!newUsername || !newPassword) {
      setInviteError('Please fill out both fields.');
      return;
    }

    if (admins.some(admin => admin.username === newUsername)) {
      setInviteError('An admin account with this login already exists.');
      return;
    }

    const updatedAdmins = [...admins, { username: newUsername, password: newPassword }];
    setAdmins(updatedAdmins);
    if (typeof window !== 'undefined') {
      localStorage.setItem('netcore_admins', JSON.stringify(updatedAdmins));
    }
    
    setInviteForm({ username: '', password: '' });
    setInviteError('');
    setIsInviteModalOpen(false);
    alert(`Success: Admin account "${newUsername}" has been created!`);
  };"""

    new_auth = """  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUsername.trim().toLowerCase();
    const p = loginPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      if (res.ok) {
        setIsLoggedIn(true);
        setCurrentUser(u);
        setLoginError('');
        if (typeof window !== 'undefined') {
          localStorage.setItem('netcore_session', u);
        }
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Invalid login or password.');
      }
    } catch (err) {
      setLoginError('An error occurred during login.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('netcore_session');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUsername = inviteForm.username.trim().toLowerCase();
    const newPassword = inviteForm.password;

    if (!newUsername || !newPassword) {
      setInviteError('Please fill out both fields.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (res.ok) {
        setAdmins([...admins, { username: newUsername }]);
        setInviteForm({ username: '', password: '' });
        setInviteError('');
        setIsInviteModalOpen(false);
        alert(`Success: Admin account "${newUsername}" has been created!`);
      } else {
        const errData = await res.json();
        setInviteError(errData.error || 'Failed to create admin account.');
      }
    } catch (err) {
      setInviteError('An error occurred during admin registration.');
    }
  };"""

    # 3. Todo handlers
    old_todos_1 = """  const handleToggleTodo = (id: string) => {
    setCustomTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleAddInlineTodo = () => {
    if (!inlineTodoText.trim()) return;
    const dateStr = `2026-06-${currentDay.toString().padStart(2, '0')}`;
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: inlineTodoText.trim(),
      description: inlineTodoDesc.trim() || undefined,
      priority: inlineTodoPriority,
      date: dateStr,
      completed: false,
      creator: currentUser || 'admin',
      createdAt: new Date().toISOString()
    };
    setCustomTodos(prev => [...prev, newTodo]);
    setInlineTodoText('');
    setInlineTodoDesc('');
    setInlineTodoPriority('LOW');
  };"""

    new_todos_1 = """  const handleToggleTodo = async (id: string) => {
    const todo = customTodos.find(t => t.id === id);
    if (!todo) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !todo.completed }),
      });

      if (res.ok) {
        setCustomTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
      }
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleAddInlineTodo = async () => {
    if (!inlineTodoText.trim()) return;
    const dateStr = `2026-06-${currentDay.toString().padStart(2, '0')}`;
    
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inlineTodoText.trim(),
          description: inlineTodoDesc.trim() || undefined,
          priority: inlineTodoPriority,
          date: dateStr,
          creator: currentUser || 'admin',
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setCustomTodos(prev => [...prev, newTodo]);
        setInlineTodoText('');
        setInlineTodoDesc('');
        setInlineTodoPriority('LOW');
      }
    } catch (err) {
      console.error('Error adding inline todo:', err);
    }
  };"""

    old_todos_2 = """  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormText.trim()) return;

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: taskFormText.trim(),
      description: taskFormDesc.trim() || undefined,
      priority: taskFormPriority,
      date: taskFormDate,
      completed: false,
      creator: currentUser || 'admin',
      createdAt: new Date().toISOString()
    };

    setCustomTodos(prev => [...prev, newTodo]);
    setTaskFormText('');
    setTaskFormDesc('');
    setTaskFormPriority('MEDIUM');
    setTaskFormDate(new Date().toISOString().split('T')[0]);
    alert('Task successfully created!');
  };

  const handleDeleteTodo = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setCustomTodos(prev => prev.filter(t => t.id !== id));
    }
  };"""

    new_todos_2 = """  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormText.trim()) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: taskFormText.trim(),
          description: taskFormDesc.trim() || undefined,
          priority: taskFormPriority,
          date: taskFormDate,
          creator: currentUser || 'admin',
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setCustomTodos(prev => [...prev, newTodo]);
        setTaskFormText('');
        setTaskFormDesc('');
        setTaskFormPriority('MEDIUM');
        setTaskFormDate(new Date().toISOString().split('T')[0]);
        alert('Task successfully created!');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const res = await fetch(`/api/todos?id=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomTodos(prev => prev.filter(t => t.id !== id));
        }
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };"""

    # 4. handleSaveJob
    old_save_job = """  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.technicianId || !jobForm.ratePlanCode || !jobForm.cityId) {
      alert('Please ensure Technician, Job Code, and City are selected.');
      return;
    }

    const tech = customTechnicians.find(t => t.id === parseInt(jobForm.technicianId));
    if (!tech) return;

    const ratePlan = customRatePlans.find(r => 
      r.stateCode === tech.stateCode && 
      r.provider === jobForm.provider && 
      r.code === jobForm.ratePlanCode
    );
    if (!ratePlan) {
      alert('No rate plan found matching these parameters.');
      return;
    }

    const city = customCities.find(c => c.id === parseInt(jobForm.cityId));
    if (!city) return;

    const gross = ratePlan.grossPrice;
    const defaultPayout = ratePlan.employeePrice;

    // Contract company cut resolution
    let profit = gross - defaultPayout;
    let payout = defaultPayout;

    if (tech.payoutType === 'PERCENTAGE') {
      profit = gross * (tech.payoutValue / 100);
    } else {
      profit = tech.payoutValue;
    }
    payout = Math.max(0, gross - profit);
    // Round to 2 decimal places
    profit = Math.round(profit * 100) / 100;
    payout = Math.round(payout * 100) / 100;
    const newId = Math.max(1000, ...customJobLogs.map(j => j.id)) + 1;

    const newJob: JobLog = {
      id: newId,
      date: jobForm.date,
      technicianId: tech.id,
      technicianName: tech.name,
      ratePlanId: ratePlan.id,
      ratePlanCode: ratePlan.code,
      provider: jobForm.provider,
      cityId: city.id,
      cityName: city.name,
      stateCode: tech.stateCode,
      companyRevenue: gross,
      techPayout: payout,
      companyProfit: profit
    };

    setCustomJobLogs(prev => [newJob, ...prev]);
    setIsJobModalOpen(false);
  };"""

    new_save_job = """  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.technicianId || !jobForm.ratePlanCode || !jobForm.cityId) {
      alert('Please ensure Technician, Job Code, and City are selected.');
      return;
    }

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });

      if (res.ok) {
        const newJob = await res.json();
        setCustomJobLogs(prev => [newJob, ...prev]);
        setIsJobModalOpen(false);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to dispatch job log.');
      }
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };"""

    # 5. handleUploadDocument, handleDeleteDocument
    old_documents = """  const handleUploadDocument = (
    techId: number,
    file: File,
    category: TechDocument['category']
  ) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const doc: TechDocument = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        technicianId: techId,
        name: file.name,
        fileType: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl,
        category
      };
      setCustomDocuments(prev => [...prev, doc]);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (docId: string) => {
    if (confirm('Delete this document? This cannot be undone.')) {
      setCustomDocuments(prev => prev.filter(d => d.id !== docId));
    }
  };"""

    new_documents = """  const handleUploadDocument = (
    techId: number,
    file: File,
    category: TechDocument['category']
  ) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      
      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technicianId: techId,
            name: file.name,
            fileType: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl,
            category,
          }),
        });

        if (res.ok) {
          const doc = await res.json();
          setCustomDocuments(prev => [...prev, doc]);
        }
      } catch (err) {
        console.error('Error uploading document:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm('Delete this document? This cannot be undone.')) {
      try {
        const res = await fetch(`/api/documents?id=${docId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomDocuments(prev => prev.filter(d => d.id !== docId));
        }
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };"""

    # 6. handleSaveTech, handleDeleteTech
    old_tech = """  const handleSaveTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techForm.name.trim() || !techForm.email.trim() || !techForm.phone.trim()) {
      alert('Please fill in Name, Email, and Phone.');
      return;
    }

    const stateObj = customStates.find(s => s.code === techForm.stateCode);
    const stateId = stateObj ? stateObj.id : 1;

    const payoutValueNum = parseFloat(techForm.payoutValue) || 0;

    let savedTechId = 0;
    if (editingTech) {
      savedTechId = editingTech.id;
      setCustomTechnicians(prev => prev.map(t => t.id === editingTech.id ? {
        ...t,
        name: techForm.name.trim(),
        email: techForm.email.trim(),
        phone: techForm.phone.trim(),
        status: techForm.status,
        workType: techForm.workType,
        stateId,
        stateCode: techForm.stateCode,
        payoutType: techForm.payoutType,
        payoutValue: payoutValueNum,
        notes: techForm.notes
      } : t));
    } else {
      const newId = Math.max(0, ...customTechnicians.map(t => t.id)) + 1;
      savedTechId = newId;
      const newTech: Technician = {
        id: newId,
        name: techForm.name.trim(),
        email: techForm.email.trim(),
        phone: techForm.phone.trim(),
        status: techForm.status,
        workType: techForm.workType,
        stateId,
        stateCode: techForm.stateCode,
        payoutType: techForm.payoutType,
        payoutValue: payoutValueNum,
        notes: techForm.notes
      };
      setCustomTechnicians(prev => [...prev, newTech]);
    }

    // Vehicle Assignment update
    setCustomVehicles(prev => {
      let updated = prev.map(v => {
        if (v.technicianId === savedTechId) {
          return { ...v, technicianId: undefined };
        }
        return v;
      });

      if (techForm.vehicleId) {
        const vId = parseInt(techForm.vehicleId);
        updated = updated.map(v => {
          if (v.id === vId) {
            return { ...v, technicianId: savedTechId };
          }
          return v;
        });
      }
      return updated;
    });

    setIsTechModalOpen(false);
    setEditingTech(null);
  };

  const handleDeleteTech = (techId: number) => {
    if (confirm('Are you sure you want to delete this field technician? Any vehicles assigned to them will be unassigned.')) {
      setCustomTechnicians(prev => prev.filter(t => t.id !== techId));
      setCustomVehicles(prev => prev.map(v => v.technicianId === techId ? { ...v, technicianId: undefined } : v));
      if (selectedTechId === techId) {
        setSelectedTechId(null);
      }
    }
  };"""

    new_tech = """  const handleSaveTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techForm.name.trim() || !techForm.email.trim() || !techForm.phone.trim()) {
      alert('Please fill in Name, Email, and Phone.');
      return;
    }

    try {
      const isEdit = !!editingTech;
      const url = '/api/techs';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...techForm,
        id: isEdit ? editingTech.id : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedTech = await res.json();
        
        if (isEdit) {
          setCustomTechnicians(prev => prev.map(t => t.id === editingTech.id ? savedTech : t));
        } else {
          setCustomTechnicians(prev => [...prev, savedTech]);
        }

        // Update local vehicles to match new assignment
        setCustomVehicles(prev => {
          let updated = prev.map(v => {
            if (v.technicianId === savedTech.id) {
              return { ...v, technicianId: undefined };
            }
            return v;
          });

          if (techForm.vehicleId) {
            const vId = parseInt(techForm.vehicleId);
            updated = updated.map(v => {
              if (v.id === vId) {
                return { ...v, technicianId: savedTech.id };
              }
              return v;
            });
          }
          return updated;
        });

        setIsTechModalOpen(false);
        setEditingTech(null);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save technician.');
      }
    } catch (err) {
      console.error('Error saving technician:', err);
    }
  };

  const handleDeleteTech = async (techId: number) => {
    if (confirm('Are you sure you want to delete this field technician? Any vehicles assigned to them will be unassigned.')) {
      try {
        const res = await fetch(`/api/techs?id=${techId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomTechnicians(prev => prev.filter(t => t.id !== techId));
          setCustomVehicles(prev => prev.map(v => v.technicianId === techId ? { ...v, technicianId: undefined } : v));
          if (selectedTechId === techId) {
            setSelectedTechId(null);
          }
        }
      } catch (err) {
        console.error('Error deleting technician:', err);
      }
    }
  };"""

    # 7. handleCommitParsedJobs
    old_commit_parsed = """  const handleCommitParsedJobs = () => {
    const hasUnmatched = parsedJobs.some(j => !j.matchedTechId);
    if (hasUnmatched) {
      if (!confirm('There are unmatched technicians in the list. They will import with a default 8% company cut. Do you want to proceed?')) {
        return;
      }
    }
    
    const newJobs: JobLog[] = parsedJobs.map((job, idx) => {
      const tech = customTechnicians.find(t => t.id === job.matchedTechId);
      const techName = tech ? tech.name : (job.techNameRaw || 'Unknown Technician');
      const techId = tech ? tech.id : 999;
      const stateCode = tech ? tech.stateCode : (job.stateCode || 'TN');
      
      const ratePlan = customRatePlans.find(r => r.code === job.jobCode && r.stateCode === stateCode);
      const ratePlanId = ratePlan ? ratePlan.id : Math.floor(Math.random() * 1000) + 2000;
      
      const city = customCities.find(c => c.name.toLowerCase() === job.city.toLowerCase() && c.stateId === (tech ? tech.stateId : 1));
      const cityId = city ? city.id : 101;
      
      return {
        id: Math.max(1000, ...customJobLogs.map(j => j.id)) + 1 + idx,
        date: job.date,
        technicianId: techId,
        technicianName: techName,
        ratePlanId,
        ratePlanCode: job.jobCode || 'RDP',
        provider: job.provider || 'Spectrum',
        cityId,
        cityName: job.city || 'Nashville',
        stateCode,
        companyRevenue: job.grossAmount * job.quantity,
        techPayout: job.techPayout,
        companyProfit: job.companyProfit
      };
    });
    
    const updatedJobLogs = [...newJobs, ...customJobLogs];
    setCustomJobLogs(updatedJobLogs);
    localStorage.setItem('netcore_job_logs', JSON.stringify(updatedJobLogs));
    
    alert(`Successfully imported ${newJobs.length} jobs to the ledger database!`);
    setParsedJobs([]);
    setImportRawText('');
    setJobsTab('ledger');
  };"""

    new_commit_parsed = """  const handleCommitParsedJobs = async () => {
    const hasUnmatched = parsedJobs.some(j => !j.matchedTechId);
    if (hasUnmatched) {
      if (!confirm('There are unmatched technicians in the list. They will import with a default 8% company cut. Do you want to proceed?')) {
        return;
      }
    }
    
    try {
      const res = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: parsedJobs }),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomJobLogs(prev => [...data.jobs, ...prev]);
        alert(`Successfully imported ${data.count} jobs to the ledger database!`);
        setParsedJobs([]);
        setImportRawText('');
        setJobsTab('ledger');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to import bulk jobs.');
      }
    } catch (err) {
      console.error('Error committing bulk jobs:', err);
    }
  };"""

    # 8. handleSaveVehicle, handleDeleteVehicle
    old_vehicle = """  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.make.trim() || !vehicleForm.model.trim() || !vehicleForm.vin.trim() || !vehicleForm.plateNumber.trim()) {
      alert('Please fill in all vehicle details.');
      return;
    }

    const yearNum = parseInt(vehicleForm.year) || new Date().getFullYear();

    if (editingVehicle) {
      setCustomVehicles(prev => prev.map(v => v.id === editingVehicle.id ? {
        ...v,
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        year: yearNum,
        vin: vehicleForm.vin.trim().toUpperCase(),
        plateNumber: vehicleForm.plateNumber.trim().toUpperCase(),
        ownershipType: vehicleForm.ownershipType,
        status: vehicleForm.status
      } : v));
    } else {
      const newId = Math.max(0, ...customVehicles.map(v => v.id)) + 1;
      const newVehicle: Vehicle = {
        id: newId,
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        year: yearNum,
        vin: vehicleForm.vin.trim().toUpperCase(),
        plateNumber: vehicleForm.plateNumber.trim().toUpperCase(),
        ownershipType: vehicleForm.ownershipType,
        status: vehicleForm.status
      };
      setCustomVehicles(prev => [...prev, newVehicle]);
    }

    setIsVehicleModalOpen(false);
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = (vehicleId: number) => {
    if (confirm('Are you sure you want to delete this vehicle from the fleet registry?')) {
      setCustomVehicles(prev => prev.filter(v => v.id !== vehicleId));
    }
  };"""

    new_vehicle = """  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.make.trim() || !vehicleForm.model.trim() || !vehicleForm.vin.trim() || !vehicleForm.plateNumber.trim()) {
      alert('Please fill in all vehicle details.');
      return;
    }

    try {
      const isEdit = !!editingVehicle;
      const url = '/api/vehicles';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...vehicleForm,
        id: isEdit ? editingVehicle.id : undefined,
        technicianId: isEdit ? editingVehicle.technicianId : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedVehicle = await res.json();
        if (isEdit) {
          setCustomVehicles(prev => prev.map(v => v.id === editingVehicle.id ? savedVehicle : v));
        } else {
          setCustomVehicles(prev => [...prev, savedVehicle]);
        }
        setIsVehicleModalOpen(false);
        setEditingVehicle(null);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save vehicle.');
      }
    } catch (err) {
      console.error('Error saving vehicle:', err);
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (confirm('Are you sure you want to delete this vehicle from the fleet registry?')) {
      try {
        const res = await fetch(`/api/vehicles?id=${vehicleId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomVehicles(prev => prev.filter(v => v.id !== vehicleId));
        }
      } catch (err) {
        console.error('Error deleting vehicle:', err);
      }
    }
  };"""

    # 9. All useEffect blocks (Mount and Persistence)
    mount_start_marker = "  useEffect(() => {\n    if (typeof window !== 'undefined') {\n      // Force one-time cleanup of mock data if version is older"
    mount_end_marker = "  }, [customTodos, isInitialized]);"
    
    new_mount_and_persist = """  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/bootstrap');
        const data = await res.json();
        if (data) {
          setCustomStates(data.states || []);
          setCustomCities(data.cities || []);
          setCustomRatePlans(data.ratePlans || []);
          setCustomTechnicians(data.technicians || []);
          setCustomVehicles(data.vehicles || []);
          setCustomJobLogs(data.jobLogs || []);
          setCustomDocuments(data.documents || []);
          setCustomTodos(data.todos || []);
          setAdmins(data.admins || []);
        }
      } catch (e) {
        console.error('Failed to bootstrap data:', e);
      } finally {
        setIsInitialized(true);
      }
    }
    loadData();

    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('netcore_session');
      if (session) {
        setIsLoggedIn(true);
        setCurrentUser(session);
      }
    }
  }, []);"""

    # 10. handleResetRates
    old_reset = """  const handleResetRates = () => {
    if (confirm('Are you sure you want to reset all rate plans, states, cities, technicians, vehicles, job logs, and tasks to default values? Any custom or imported data will be lost.')) {
      setCustomRatePlans(ratePlans.map(rp => ({
        ...rp,
        description: sanitizeDescription(rp.description)
      })));
      setCustomStates(states);
      setCustomCities(cities);
      setCustomTechnicians(technicians);
      setCustomVehicles(vehicles);
      setCustomJobLogs(jobLogs);
      setCustomDocuments([]);
      
      const defaultTodos: Todo[] = [
        {
          id: 'todo-1',
          text: 'Review Nashville invoice',
          description: 'Verify regional rate sheets and contractor percentages',
          priority: 'LOW',
          date: '2026-06-01',
          completed: true,
          creator: 'haidemskyi',
          createdAt: new Date('2026-06-01T09:00:00.000Z').toISOString()
        },
        {
          id: 'todo-2',
          text: 'Audit Spectrum CSV imports',
          description: 'Check TSV cell mappings and resolve unmatched technicians',
          priority: 'MEDIUM',
          date: '2026-06-02',
          completed: true,
          creator: 'haidemskyi',
          createdAt: new Date('2026-06-02T10:00:00.000Z').toISOString()
        },
        {
          id: 'todo-3',
          text: 'Review dispatch order logs',
          description: 'Audit company profit calculations for Comcast orders',
          priority: 'LOW',
          date: '2026-06-03',
          completed: true,
          creator: 'admin',
          createdAt: new Date('2026-06-03T11:00:00.000Z').toISOString()
        },
        {
          id: 'todo-4',
          text: 'Submit weekly state reports',
          description: 'Generate performance leaderboards for TN, FL, PA, and TX',
          priority: 'HIGH',
          date: '2026-06-05',
          completed: false,
          creator: 'haidemskyi',
          createdAt: new Date('2026-06-05T08:30:00.000Z').toISOString()
        },
        {
          id: 'todo-5',
          text: 'Verify vehicle plate numbers',
          description: 'Check active service status for Ford and Chevrolet vans',
          priority: 'HIGH',
          date: '2026-06-10',
          completed: false,
          creator: 'admin',
          createdAt: new Date('2026-06-05T09:00:00.000Z').toISOString()
        }
      ];
      setCustomTodos(defaultTodos);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('netcore_rate_plans');
        localStorage.removeItem('netcore_states');
        localStorage.removeItem('netcore_cities');
        localStorage.removeItem('netcore_technicians');
        localStorage.removeItem('netcore_vehicles');
        localStorage.removeItem('netcore_job_logs');
        localStorage.removeItem('netcore_documents');
        localStorage.removeItem('netcore_todos');
      }
    }
  };"""

    new_reset = """  const handleResetRates = async () => {
    if (confirm('Are you sure you want to reset all rate plans, states, cities, technicians, vehicles, job logs, and tasks to default values? Any custom or imported data will be lost.')) {
      try {
        const res = await fetch('/api/rateplans/reset', {
          method: 'POST',
        });

        if (res.ok) {
          window.location.reload();
        } else {
          alert('Failed to reset database.');
        }
      } catch (err) {
        console.error('Error resetting database:', err);
      }
    }
  };"""

    # 11. handleSaveNewState
    old_new_state = """  const handleSaveNewState = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newStateForm.code.trim().toUpperCase();
    const name = newStateForm.name.trim();
    if (!code || !name) {
      alert('Please fill in both fields.');
      return;
    }
    if (code.length !== 2) {
      alert('State code must be exactly 2 letters.');
      return;
    }
    handleAddState(code, name);
    setSelectedStateCode(code);
    setSelectedTechId(null);
    setNewStateForm({ code: '', name: '' });
    setIsAddStateModalOpen(false);
  };"""

    new_new_state = """  const handleSaveNewState = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newStateForm.code.trim().toUpperCase();
    const name = newStateForm.name.trim();
    if (!code || !name) {
      alert('Please fill in both fields.');
      return;
    }
    if (code.length !== 2) {
      alert('State code must be exactly 2 letters.');
      return;
    }

    try {
      const res = await fetch('/api/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name }),
      });

      if (res.ok) {
        const newState = await res.json();
        setCustomStates(prev => {
          if (prev.some(s => s.code.toUpperCase() === code.toUpperCase())) return prev;
          return [...prev, newState];
        });
        setSelectedStateCode(code);
        setSelectedTechId(null);
        setNewStateForm({ code: '', name: '' });
        setIsAddStateModalOpen(false);
      }
    } catch (err) {
      console.error('Error saving state:', err);
    }
  };"""

    # 12. handleBulkImport
    old_bulk_import = """  const handleBulkImport = (newRates: Omit<RatePlan, 'id'>[], overwriteDuplicates: boolean) => {
    setCustomRatePlans(prev => {
      const updated = [...prev];
      
      newRates.forEach(newRate => {
        // Find if this code already exists for this state, provider, and city
        const existingIdx = updated.findIndex(rp => 
          rp.code.toUpperCase() === newRate.code.toUpperCase() && 
          rp.stateCode === newRate.stateCode && 
          rp.provider.toLowerCase() === newRate.provider.toLowerCase() &&
          (newRate.cityName ? rp.cityName === newRate.cityName : !rp.cityName)
        );

        if (existingIdx !== -1) {
          if (overwriteDuplicates) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              description: sanitizeDescription(newRate.description) || updated[existingIdx].description,
              grossPrice: newRate.grossPrice,
              employeePrice: newRate.employeePrice
            };
          }
        } else {
          const newId = Math.max(0, ...updated.map(r => r.id)) + 1;
          updated.push({
            id: newId,
            ...newRate,
            description: sanitizeDescription(newRate.description)
          });
        }
      });

      return updated;
    });
  };"""

    new_bulk_import = """  const handleBulkImport = async (newRates: Omit<RatePlan, 'id'>[], overwriteDuplicates: boolean) => {
    try {
      const res = await fetch('/api/rateplans/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: newRates, overwriteDuplicates }),
      });

      if (res.ok) {
        const data = await res.json();
        
        setCustomRatePlans(prev => {
          const updated = [...prev];
          data.rates.forEach((newRate: RatePlan) => {
            const idx = updated.findIndex(r => r.id === newRate.id);
            if (idx !== -1) {
              updated[idx] = newRate;
            } else {
              updated.push(newRate);
            }
          });
          return updated;
        });

        const uniqueStates = Array.from(new Set(data.rates.map((r: RatePlan) => r.stateCode))) as string[];
        for (const stCode of uniqueStates) {
          if (!customStates.some(s => s.code === stCode)) {
            setCustomStates(prev => [...prev, { id: Math.max(0, ...prev.map(s => s.id)) + 1, code: stCode, name: stCode }]);
          }
        }

        alert(`Successfully imported/updated ${data.count} rate plans!`);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to import bulk rates.');
      }
    } catch (err) {
      console.error('Error bulk importing rate plans:', err);
    }
  };"""

    # 13. handleQuickRateRecalc, handleQuickTechRecalc
    old_quick_recalc = """  const handleQuickRateRecalc = () => {
    const cutVal = parseFloat(quickRateCut);
    if (isNaN(cutVal) || cutVal < 0 || cutVal > 100) {
      alert('Please enter a valid company cut percentage between 0 and 100.');
      return;
    }
    
    const count = customRatePlans.filter(r => r.stateCode === quickRateState).length;
    if (count === 0) {
      alert(`No rate plans found for state ${quickRateState}.`);
      return;
    }

    if (confirm(`Are you sure you want to recalculate tech payouts for all ${count} rate plans in ${quickRateState} to represent a ${cutVal}% company cut?`)) {
      setCustomRatePlans(prev => prev.map(rp => {
        if (rp.stateCode !== quickRateState) return rp;
        const newEmpPrice = rp.grossPrice * (1 - cutVal / 100);
        return {
          ...rp,
          employeePrice: Math.max(0, Math.round(newEmpPrice * 100) / 100)
        };
      }));
      alert(`Successfully updated employee payouts for ${count} rates in ${quickRateState}.`);
    }
  };

  const handleQuickTechRecalc = () => {
    const cutVal = parseFloat(quickTechCut);
    if (isNaN(cutVal) || cutVal < 0 || cutVal > 100) {
      alert('Please enter a valid company cut percentage between 0 and 100.');
      return;
    }

    const count = customTechnicians.filter(t => t.stateCode === quickTechState).length;
    if (count === 0) {
      alert(`No technicians found for state ${quickTechState}.`);
      return;
    }

    if (confirm(`Are you sure you want to update the company cut to ${cutVal}% for all ${count} technicians in ${quickTechState}?`)) {
      setCustomTechnicians(prev => prev.map(t => {
        if (t.stateCode !== quickTechState) return t;
        return {
          ...t,
          payoutValue: cutVal,
          payoutType: 'PERCENTAGE'
        };
      }));
      alert(`Successfully updated company cuts for ${count} technicians in ${quickTechState}.`);
    }
  };"""

    new_quick_recalc = """  const handleQuickRateRecalc = async () => {
    const cutVal = parseFloat(quickRateCut);
    if (isNaN(cutVal) || cutVal < 0 || cutVal > 100) {
      alert('Please enter a valid company cut percentage between 0 and 100.');
      return;
    }
    
    const count = customRatePlans.filter(r => r.stateCode === quickRateState).length;
    if (count === 0) {
      alert(`No rate plans found for state ${quickRateState}.`);
      return;
    }

    if (confirm(`Are you sure you want to recalculate tech payouts for all ${count} rate plans in ${quickRateState} to represent a ${cutVal}% company cut?`)) {
      try {
        const res = await fetch('/api/rateplans/recalc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stateCode: quickRateState, cutVal }),
        });

        if (res.ok) {
          setCustomRatePlans(prev => prev.map(rp => {
            if (rp.stateCode !== quickRateState) return rp;
            const newEmpPrice = rp.grossPrice * (1 - cutVal / 100);
            return {
              ...rp,
              employeePrice: Math.max(0, Math.round(newEmpPrice * 100) / 100)
            };
          }));
          alert(`Successfully updated employee payouts for ${count} rates in ${quickRateState}.`);
        }
      } catch (err) {
        console.error('Error recalculating rates:', err);
      }
    }
  };

  const handleQuickTechRecalc = async () => {
    const cutVal = parseFloat(quickTechCut);
    if (isNaN(cutVal) || cutVal < 0 || cutVal > 100) {
      alert('Please enter a valid company cut percentage between 0 and 100.');
      return;
    }

    const count = customTechnicians.filter(t => t.stateCode === quickTechState).length;
    if (count === 0) {
      alert(`No field technicians found in ${quickTechState}.`);
      return;
    }

    if (confirm(`Are you sure you want to recalculate payout parameters for all ${count} field technicians in ${quickTechState} to represent a default ${cutVal}% company cut?`)) {
      try {
        const res = await fetch('/api/techs/recalc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stateCode: quickTechState, cutVal }),
        });

        if (res.ok) {
          setCustomTechnicians(prev => prev.map(t => {
            if (t.stateCode !== quickTechState) return t;
            return {
              ...t,
              payoutType: 'PERCENTAGE',
              payoutValue: cutVal
            };
          }));
          alert(`Successfully updated payout parameters for all ${count} technicians in ${quickTechState}.`);
        }
      } catch (err) {
        console.error('Error recalculating techs:', err);
      }
    }
  };"""

    # 14. handleSaveRate, handleDeleteRate
    old_save_rate = """  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.provider.trim() || !rateForm.code.trim() || !rateForm.grossPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const companyPriceNum = parseFloat(rateForm.grossPrice);
    let employeePriceNum = parseFloat(rateForm.employeePrice);

    if (rateForm.autoCalc) {
      const margin = parseFloat(rateForm.retentionPercent) || 0;
      employeePriceNum = companyPriceNum * (1 - margin / 100);
    }

    if (isNaN(companyPriceNum) || isNaN(employeePriceNum)) {
      alert('Price must be a valid number');
      return;
    }

    if (editingRate) {
      // Update existing
      setCustomRatePlans(prev => prev.map(rp => rp.id === editingRate.id ? {
        ...rp,
        provider: rateForm.provider.trim(),
        stateCode: rateForm.stateCode,
        cityName: rateForm.cityName || undefined,
        code: rateForm.code.trim().toUpperCase(),
        description: sanitizeDescription(rateForm.description),
        grossPrice: companyPriceNum,
        employeePrice: employeePriceNum
      } : rp));
    } else {
      // Create new
      const newId = Math.max(0, ...customRatePlans.map(r => r.id)) + 1;
      const newRate: RatePlan = {
        id: newId,
        provider: rateForm.provider.trim(),
        stateCode: rateForm.stateCode,
        cityName: rateForm.cityName || undefined,
        code: rateForm.code.trim().toUpperCase(),
        description: sanitizeDescription(rateForm.description),
        grossPrice: companyPriceNum,
        employeePrice: employeePriceNum
      };
      setCustomRatePlans(prev => [...prev, newRate]);
    }

    setIsRateModalOpen(false);
    setEditingRate(null);
  };

  const handleDeleteRate = (rateId: number) => {
    if (confirm('Are you sure you want to delete this rate plan?')) {
      setCustomRatePlans(prev => prev.filter(rp => rp.id !== rateId));
    }
  };"""

    new_save_rate = """  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.provider.trim() || !rateForm.code.trim() || !rateForm.grossPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const companyPriceNum = parseFloat(rateForm.grossPrice);
    let employeePriceNum = parseFloat(rateForm.employeePrice);

    if (rateForm.autoCalc) {
      const margin = parseFloat(rateForm.retentionPercent) || 0;
      employeePriceNum = companyPriceNum * (1 - margin / 100);
    }

    if (isNaN(companyPriceNum) || isNaN(employeePriceNum)) {
      alert('Price must be a valid number');
      return;
    }

    try {
      const body = {
        id: editingRate ? editingRate.id : undefined,
        provider: rateForm.provider.trim(),
        stateCode: rateForm.stateCode,
        code: rateForm.code.trim().toUpperCase(),
        description: sanitizeDescription(rateForm.description),
        grossPrice: companyPriceNum,
        employeePrice: employeePriceNum
      };

      const res = await fetch('/api/rateplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedRate = await res.json();
        if (editingRate) {
          setCustomRatePlans(prev => prev.map(rp => rp.id === editingRate.id ? savedRate : rp));
        } else {
          setCustomRatePlans(prev => [...prev, savedRate]);
        }
        setIsRateModalOpen(false);
        setEditingRate(null);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save rate plan.');
      }
    } catch (err) {
      console.error('Error saving rate plan:', err);
    }
  };

  const handleDeleteRate = async (rateId: number) => {
    if (confirm('Are you sure you want to delete this rate plan?')) {
      try {
        const res = await fetch(`/api/rateplans?id=${rateId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomRatePlans(prev => prev.filter(rp => rp.id !== rateId));
        }
      } catch (err) {
        console.error('Error deleting rate plan:', err);
      }
    }
  };"""

    # Helper function to clean strings to avoid spacing issues
    def clean_str(s):
        return "\n".join([line.strip() for line in s.strip().splitlines()])

    # Normalize script strings to match unix layout
    old_admins_state_u = old_admins_state.strip()
    new_admins_state_u = new_admins_state.strip()
    
    old_auth_u = clean_str(old_auth)
    new_auth_u = new_auth.strip() # keep layout for replacements

    # Let's perform normalization on the file content for easier searches
    lines = content.split("\n")
    
    # We will search by matching cleaned lines
    def find_and_replace_block(lines, old_block_str, new_block_str, name=""):
        non_empty_lines = [(idx, line.strip()) for idx, line in enumerate(lines) if line.strip()]
        old_lines = [l.strip() for l in old_block_str.strip().splitlines() if l.strip()]
        
        start_idx_in_ne = -1
        for i in range(len(non_empty_lines) - len(old_lines) + 1):
            match = True
            for j in range(len(old_lines)):
                if non_empty_lines[i+j][1] != old_lines[j]:
                    match = False
                    break
            if match:
                start_idx_in_ne = i
                break
                
        if start_idx_in_ne == -1:
            print(f"Block '{name}' NOT FOUND")
            return False
            
        start_idx = non_empty_lines[start_idx_in_ne][0]
        end_idx = non_empty_lines[start_idx_in_ne + len(old_lines) - 1][0] + 1
        
        print(f"Block '{name}' FOUND at lines {start_idx+1} to {end_idx}")
        # replace the lines range
        lines[start_idx:end_idx] = [new_block_str]
        return True

    # 1. Replace admins state definition
    for i, line in enumerate(lines):
        if old_admins_state_u in line:
            print(f"Block 'old_admins_state' FOUND at line {i+1}")
            lines[i] = line.replace(old_admins_state_u, new_admins_state_u)
            break
    else:
        print("Block 'old_admins_state' NOT FOUND")
        return

    # 2. Replace auth block
    if not find_and_replace_block(lines, old_auth, new_auth, "old_auth"): return
    if not find_and_replace_block(lines, old_todos_1, new_todos_1, "old_todos_1"): return
    if not find_and_replace_block(lines, old_todos_2, new_todos_2, "old_todos_2"): return
    if not find_and_replace_block(lines, old_save_job, new_save_job, "old_save_job"): return
    if not find_and_replace_block(lines, old_documents, new_documents, "old_documents"): return
    if not find_and_replace_block(lines, old_tech, new_tech, "old_tech"): return
    if not find_and_replace_block(lines, old_commit_parsed, new_commit_parsed, "old_commit_parsed"): return
    if not find_and_replace_block(lines, old_vehicle, new_vehicle, "old_vehicle"): return

    # 9. Find and replace useEffects block
    # Start pattern: "useEffect(() => {" and "localStorage.getItem('netcore_data_version_v3')"
    # End pattern: "}, [customTodos, isInitialized]);"
    start_ue = -1
    end_ue = -1
    for i in range(len(lines)):
        if "useEffect" in lines[i] and any("netcore_data_version" in lines[i+k] for k in range(1, min(10, len(lines) - i))):
            start_ue = i
            break
            
    if start_ue != -1:
        # find end pattern
        for j in range(start_ue, len(lines)):
            if "}, [customTodos, isInitialized]);" in lines[j]:
                end_ue = j + 1
                break
                
    if start_ue == -1 or end_ue == -1:
        print("Block 'mount_and_persist_useeffects' NOT FOUND")
        return
        
    print(f"Block 'mount_and_persist_useeffects' FOUND at lines {start_ue+1} to {end_ue}")
    lines[start_ue:end_ue] = [new_mount_and_persist]

    # 10. Replace reset, new_state, bulk_import, quick_recalc, save_rate
    if not find_and_replace_block(lines, old_reset, new_reset, "old_reset"): return
    if not find_and_replace_block(lines, old_new_state, new_new_state, "old_new_state"): return
    if not find_and_replace_block(lines, old_bulk_import, new_bulk_import, "old_bulk_import"): return
    if not find_and_replace_block(lines, old_quick_recalc, new_quick_recalc, "old_quick_recalc"): return
    if not find_and_replace_block(lines, old_save_rate, new_save_rate, "old_save_rate"): return

    # Write back
    patched_content = "\n".join(lines)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(patched_content)
        
    print("Patch applied successfully using line parser!")

if __name__ == "__main__":
    main()
