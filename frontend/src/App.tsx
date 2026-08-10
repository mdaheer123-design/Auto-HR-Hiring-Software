import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, FileText, CheckCircle2, 
  Sparkles, MessageSquare, Send, Plus, LogOut, Loader2, 
  Clock, Upload, AlertCircle, X, Check,
  FileDown, Calendar, Link, Bell,
  Search, ArrowLeft, Bookmark, Users, Building2, MapPin, Trash2, User, Inbox,
  Eye, Zap, RefreshCw
} from 'lucide-react';

// API Base URL (Vite proxy redirects this to http://localhost:8000)
const API_URL = '';

// ── Safe JSON Parse Helper ──
function safeParseJson(value: string | null | undefined, fallback: any = []) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    // If it's a comma-separated string, split it
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return typeof value === 'string' ? [value] : fallback;
  }
}

function formatExperienceYears(minVal: any, maxVal?: any): string {
  const min = Number(minVal);
  const max = Number(maxVal);
  if (isNaN(min) || min < 0) return '0–2 Yrs';
  if (!isNaN(max) && max > min) return `${min}–${max} Yrs`;
  if (min === 0) return '0–1 Yrs';
  return `${min}+ Yrs`;
}

const IT_JOB_TITLES = [
  "Full-Stack Developer", "Frontend Developer", "Backend Developer", "MERN Stack Developer",
  "MEAN Stack Developer", "Java Developer", "Python Developer", "Data Scientist",
  "Data Analyst", "Data Engineer", "ML Engineer", "AI Engineer", "DevOps Engineer",
  "Cloud Engineer", "QA Engineer", "Software Test Engineer", "Mobile App Developer",
  "Android Developer", "iOS Developer", "UI/UX Designer", "Business Analyst",
  "System Administrator", "Network Engineer", "Cybersecurity Analyst",
  "Database Administrator", "Product Manager", "Technical Support Engineer",
  "Generative AI Engineer", "Data entry"
];

const JOB_MAPPINGS: Record<string, { dept: string; skills: string; min: number; max: number }> = {
  "Full-Stack Developer": { dept: "Engineering", skills: "React, Node.js, TypeScript, SQL", min: 2, max: 5 },
  "Frontend Developer": { dept: "Engineering", skills: "React, CSS, JavaScript, HTML", min: 1, max: 4 },
  "Backend Developer": { dept: "Engineering", skills: "Python, Django, PostgreSQL, API", min: 2, max: 5 },
  "MERN Stack Developer": { dept: "Engineering", skills: "MongoDB, Express, React, Node.js", min: 1, max: 4 },
  "MEAN Stack Developer": { dept: "Engineering", skills: "MongoDB, Express, Angular, Node.js", min: 1, max: 4 },
  "Java Developer": { dept: "Engineering", skills: "Java, Spring Boot, Microservices, SQL", min: 3, max: 7 },
  "Python Developer": { dept: "Engineering", skills: "Python, Flask, REST, Docker", min: 2, max: 5 },
  "Data Scientist": { dept: "Data Science / Analytics", skills: "Python, Machine Learning, Pandas, SQL", min: 2, max: 6 },
  "Data Analyst": { dept: "Data Science / Analytics", skills: "SQL, Excel, Tableau, Python", min: 0, max: 3 },
  "Data Engineer": { dept: "Data Science / Analytics", skills: "Spark, Hadoop, Python, SQL", min: 3, max: 7 },
  "ML Engineer": { dept: "Data Science / Analytics", skills: "Python, TensorFlow, PyTorch, MLOps", min: 3, max: 6 },
  "AI Engineer": { dept: "Data Science / Analytics", skills: "Python, LLMs, NLP, PyTorch", min: 2, max: 5 },
  "DevOps Engineer": { dept: "Infrastructure", skills: "AWS, Kubernetes, CI/CD, Terraform", min: 3, max: 7 },
  "Cloud Engineer": { dept: "Infrastructure", skills: "AWS, Azure, GCP, Docker", min: 2, max: 6 },
  "QA Engineer": { dept: "Engineering", skills: "Selenium, Cypress, JUnit, API Testing", min: 1, max: 4 },
  "Software Test Engineer": { dept: "Engineering", skills: "Manual Testing, Automation, JIRA", min: 1, max: 4 },
  "Mobile App Developer": { dept: "Engineering", skills: "Flutter, React Native, Swift, Kotlin", min: 2, max: 5 },
  "Android Developer": { dept: "Engineering", skills: "Kotlin, Android Studio, Java", min: 2, max: 5 },
  "iOS Developer": { dept: "Engineering", skills: "Swift, Xcode, iOS SDK", min: 2, max: 5 },
  "UI/UX Designer": { dept: "Design", skills: "Figma, Adobe XD, Sketch, Wireframing", min: 2, max: 5 },
  "Business Analyst": { dept: "Product", skills: "Requirements Gathering, Agile, SQL", min: 2, max: 6 },
  "System Administrator": { dept: "IT Support", skills: "Linux, Windows Server, Networking", min: 3, max: 8 },
  "Network Engineer": { dept: "IT Support", skills: "Cisco, TCP/IP, Firewalls, Routing", min: 3, max: 7 },
  "Cybersecurity Analyst": { dept: "Security", skills: "Network Security, Penetration Testing, SIEM", min: 2, max: 6 },
  "Database Administrator": { dept: "Infrastructure", skills: "Oracle, SQL Server, MySQL, Tuning", min: 4, max: 9 },
  "Product Manager": { dept: "Product", skills: "Agile, Jira, Roadmap, Stakeholder Management", min: 4, max: 8 },
  "Technical Support Engineer": { dept: "IT Support", skills: "Troubleshooting, Customer Service, Windows", min: 1, max: 4 },
  "Generative AI Engineer": { dept: "Data Science / Analytics", skills: "Python, LangChain, OpenAI API, RAG", min: 2, max: 5 },
  "Data entry": { dept: "Operations", skills: "Typing, Excel, Data Management", min: 0, max: 2 },
};

const IT_LOCATIONS = [
  "Chennai", "Bangalore", "Coimbatore", "Cuddalore", "Hyderabad", "Pune", "Mumbai",
  "Delhi NCR", "Gurgaon", "Noida", "Kolkata", "Ahmedabad", "Kochi", "Trivandrum",
  "Madurai", "Vizag", "Indore", "Jaipur", "Chandigarh"
];

export default function App() {
  // Auth States
  const getInitialToken = () => {
    const t = localStorage.getItem('token');
    if (!t || t === 'null' || t === 'undefined') return null;
    return t;
  };
  const [token, setToken] = useState<string | null>(getInitialToken());
  const [user, setUser] = useState<any>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'hr' | 'candidate'>('candidate');
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<string>('jobs');
  const [portalMode, setPortalMode] = useState<'candidate' | 'hr'>('candidate');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, _setDeptFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [salaryFilter, _setSalaryFilter] = useState<number>(0);
  const [expFilters, setExpFilters] = useState<number[]>([]);
  const [isMyAppsExpanded, setIsMyAppsExpanded] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [viewingJobDetail, setViewingJobDetail] = useState<any | null>(null);

  const toggleSaveJob = (id: number) => {
    setSavedJobIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Job Listing (Candidate)
  const [jobs, setJobs] = useState<any[]>([]);

  // HR Post Job Form State
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [newJob, setNewJob] = useState<{
    title: string;
    department: string;
    company_name: string;
    location: string;
    job_type: string;
    experience_min: number;
    experience_max: number;
    salary_min: number | '';
    salary_max: number | '';
    openings: number;
    description: string;
    skills_required: string;
  }>({
    title: '',
    department: '',
    company_name: '',
    location: '',
    job_type: 'Full Time',
    experience_min: 0,
    experience_max: 5,
    salary_min: '',
    salary_max: '',
    openings: 1,
    description: '',
    skills_required: ''
  });
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);

  // Candidate Application State
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [candidateResumes, setCandidateResumes] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [primaryResumeId, setPrimaryResumeId] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // HR Screening States
  const [hrJobs, setHrJobs] = useState<any[]>([]);
  const [hrSelectedJob, setHrSelectedJob] = useState<any>(null);
  const [screeningAppId, setScreeningAppId] = useState<number | null>(null);
  const [screeningError, setScreeningError] = useState<{ [key: number]: string }>({});
  const [hrPipelineTab, setHrPipelineTab] = useState<string>('applied');
  const [jobCandidates, setJobCandidates] = useState<any[]>([]);
  const [candidateSearchText, setCandidateSearchText] = useState<string>('');
  const [viewingResumeText, setViewingResumeText] = useState<string | null>(null);
  const [viewingCandidateName, setViewingCandidateName] = useState<string>('');
  const [viewingCandidateProfile, setViewingCandidateProfile] = useState<any | null>(null);
  const [screeningDetails, setScreeningDetails] = useState<any | null>(null);
  const [schedulingInterview, setSchedulingInterview] = useState<number | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([
    { sender: 'bot', text: 'Hello! I am Friday, your HR co-pilot. Ask me anything about candidates, skills, or job status (e.g. "List candidates with Python skills").' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    location: '',
    headline: '',
    skills: '',
    experience_years: 0
  });

  const getHeaders = (isJson: boolean = true, customToken?: string) => {
    const activeToken = customToken || token || localStorage.getItem('token');
    const headers: any = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
    return headers;
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Auto-clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth Actions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword, full_name: authName, role: authRole };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(`Server response error (${res.status}). Is backend server running on port 8000?`);
      }

      if (!res.ok) {
        throw new Error(data.detail || data.message || `Authentication failed (${res.status})`);
      }

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
      }

      if (data.user) {
        setUser(data.user);
        const parsedSkills = safeParseJson(data.user.skills, []);
        setProfile({
          full_name: data.user.full_name || '',
          phone: data.user.phone || '',
          location: data.user.location || '',
          headline: data.user.headline || '',
          skills: Array.isArray(parsedSkills) ? parsedSkills.join(', ') : (data.user.skills || ''),
          experience_years: data.user.experience_years || 0
        });
        if (data.user.role === 'hr') {
          setActiveTab('dashboard');
        } else {
          setActiveTab('jobs');
        }
      }

      showNotification(isLogin ? 'Successfully logged in!' : 'Account registered successfully!');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setActiveTab('jobs');
    localStorage.removeItem('token');
    showNotification('Logged out successfully');
  };

  const fetchUserProfile = async (authToken?: string) => {
    const activeToken = authToken || token || localStorage.getItem('token');
    if (!activeToken || activeToken === 'null' || activeToken === 'undefined') {
      handleLogout();
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: getHeaders(false, activeToken)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        const parsedSkills = safeParseJson(data.skills, []);
        const formattedSkills = Array.isArray(parsedSkills) && parsedSkills.length > 0
          ? parsedSkills.join(', ')
          : (typeof data.skills === 'string' && data.skills.startsWith('[') ? safeParseJson(data.skills, []).join(', ') : (data.skills || ''));

        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          location: data.location || '',
          headline: data.headline || '',
          skills: formattedSkills,
          experience_years: data.experience_years || 0
        });
        if (data.role === 'hr') {
          if (!['dashboard', 'jobs_hr'].includes(activeTab)) {
            setActiveTab('dashboard');
          }
        } else if (data.role === 'candidate') {
          if (!['jobs', 'profile', 'applications', 'notifications'].includes(activeTab)) {
            setActiveTab('jobs');
          }
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      handleLogout();
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const rawSkills = profile.skills || '';
      const skillsArray = rawSkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          headline: profile.headline,
          skills: JSON.stringify(skillsArray),
          experience_years: Number(profile.experience_years)
        })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      setUser(updatedUser);
      const parsed = safeParseJson(updatedUser.skills, []);
      const formatted = Array.isArray(parsed) && parsed.length > 0
        ? parsed.join(', ')
        : (typeof updatedUser.skills === 'string' && updatedUser.skills.startsWith('[') ? safeParseJson(updatedUser.skills, []).join(', ') : (updatedUser.skills || ''));

      setProfile({
        full_name: updatedUser.full_name || '',
        phone: updatedUser.phone || '',
        location: updatedUser.location || '',
        headline: updatedUser.headline || '',
        skills: formatted,
        experience_years: updatedUser.experience_years || 0
      });
      showNotification('Profile updated successfully!');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    let queryParams = [];
    if (searchQuery) queryParams.push(`query=${encodeURIComponent(searchQuery)}`);
    if (deptFilter) queryParams.push(`department=${encodeURIComponent(deptFilter)}`);
    if (locFilter) queryParams.push(`location=${encodeURIComponent(locFilter)}`);
    if (typeFilter) queryParams.push(`job_type=${encodeURIComponent(typeFilter)}`);
    if (salaryFilter > 0) queryParams.push(`salary_min=${salaryFilter}`);
    queryParams.push(`per_page=50`);

    const url = `${API_URL}/api/jobs/?${queryParams.join('&')}`;

    try {
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchMyResumes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/resumes/me`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCandidateResumes(data || []);
        if (data.length > 0) {
          setSelectedResumeId(data[0].id);
          setPrimaryResumeId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        showNotification('Resume deleted successfully');
        fetchMyResumes();
      } else {
        const data = await res.json();
        showNotification(data.detail || 'Failed to delete resume', 'error');
      }
    } catch (err) {
      showNotification('Network error when deleting resume', 'error');
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/applications/me`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMyApplications(data || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload resume');
      const data = await res.json();
      showNotification('Resume uploaded and parsed successfully!');
      fetchMyResumes();
      if (data.id) {
        setSelectedResumeId(data.id);
        setPrimaryResumeId(data.id);
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJob || !selectedResumeId) {
      showNotification('Please select a resume before applying', 'error');
      return;
    }

    setApplyError(null);
    setLoading(true);
    try {
      console.log('Sending apply request:', { job_id: selectedJob.id, resume_id: selectedResumeId });
      const res = await fetch(`${API_URL}/api/applications/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          job_id: selectedJob.id,
          resume_id: selectedResumeId
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit application');
      }

      showNotification(`Application submitted for ${selectedJob.title}`);
      setIsApplying(false);
      setSelectedJob(null);
      fetchMyApplications();
      fetchJobs(); // Refresh jobs to update the Applied ✓ state
    } catch (err: any) {
      console.error('Apply error:', err);
      // Keep modal open, show error inline or as toast (will show as toast for now, wait, user said "show a clear inline error message above the buttons")
      // Let's set a local error state if needed, but for now we'll throw it to the UI via a new state or just the toast. The instructions said "show a clear inline error message above the buttons".
      setApplyError(err.message || 'Something went wrong submitting your application — please try again');
    } finally {
      setLoading(false);
    }
  };

  // ── HR: Dashboard ──
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hr/dashboard`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  // ── HR: Job & Candidate Management Actions ──
  const fetchHrJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHrJobs(data.jobs || []);
        
        // Auto-select the first job to load its candidate pipeline initially
        setHrSelectedJob((prev: any) => {
          if (!prev && data.jobs && data.jobs.length > 0) {
            setTimeout(() => viewCandidatesForJob(data.jobs[0], 'applied'), 0);
            return data.jobs[0];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching HR jobs:', err);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newJob.salary_min !== '' && newJob.salary_max !== '' && Number(newJob.salary_max) <= Number(newJob.salary_min)) {
      showNotification('Max Salary must be greater than Min Salary.', 'error');
      return;
    }
    
    const locs = newJob.location.split(',').map(s => s.trim()).filter(Boolean);
    if (locs.length === 0 || !locs.every(l => IT_LOCATIONS.some(valid => valid.toLowerCase() === l.toLowerCase()))) {
      showNotification('Please select valid locations from the dropdown.', 'error');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = newJob.skills_required
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await fetch(`${API_URL}/api/jobs/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...newJob,
          skills_required: JSON.stringify(skillsArray)
        })
      });

      if (!res.ok) throw new Error('Failed to post job');
      const createdJob = await res.json();
      showNotification('Job posted successfully!');
      setIsPostingJob(false);
      setNewJob({
        title: '',
        department: '',
        company_name: '',
        location: '',
        job_type: 'Full Time',
        experience_min: 0,
        experience_max: 5,
        salary_min: '',
        salary_max: '',
        openings: 1,
        description: '',
        skills_required: ''
      });
      setHrJobs(prev => [createdJob, ...prev]);
      setJobs(prev => [createdJob, ...prev]);
      setHrSelectedJob(createdJob);
      setTimeout(() => viewCandidatesForJob(createdJob, 'applied'), 0);
      fetchHrJobs();
      fetchJobs();
      fetchDashboardStats();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJobStatus = async (jobId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      const tokenStr = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStr}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showNotification(`Job status updated to ${newStatus}`);
        setHrJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
        fetchDashboardStats();
      }
    } catch (err) {
      showNotification('Error updating status', 'error');
    }
  };

  const viewCandidatesForJob = async (job?: any, statusFilter?: string) => {
    if (job) setHrSelectedJob(job);
    const targetJob = job || hrSelectedJob;
    const targetStatus = statusFilter || hrPipelineTab;
    if (statusFilter) setHrPipelineTab(statusFilter);

    try {
      let url = `${API_URL}/api/applications/job/${targetJob?.id || 1}?status_filter=${targetStatus}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setJobCandidates(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  const handleBatchScreening = async () => {
    if (!hrSelectedJob) {
      showNotification('Please select a job position first', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/screening/screen-job/${hrSelectedJob.id}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to run batch screening');
      showNotification('AI fit screening completed for all candidates!');
      viewCandidatesForJob(hrSelectedJob, hrPipelineTab);
      fetchDashboardStats();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScreening = async (appId: number) => {
    setScreeningAppId(appId);
    setScreeningError(prev => ({ ...prev, [appId]: '' }));
    try {
      const res = await fetch(`${API_URL}/api/screening/${appId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Screening failed');
      }

      const data = await res.json();
      showNotification(`AI Fit Score: ${data.score ?? data.ai_score ?? 85}/100 — Status updated`);
      
      // Remove from 'applied' tab list since it moved to 'screening'
      setJobCandidates(prev => prev.filter(c => c.id !== appId));
      
      fetchDashboardStats();
    } catch (err: any) {
      console.error('Screening error:', err);
      setScreeningError(prev => ({ ...prev, [appId]: err.message || 'Screening failed — retry' }));
    } finally {
      setScreeningAppId(null);
    }
  };

  const handleShortlistCandidate = async (appId: number) => {
    setLoading(true);
    showNotification('Shortlisting candidate & sending email notification...');
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'shortlisted' })
      });

      if (!res.ok) throw new Error('Failed to shortlist candidate');
      showNotification('Candidate shortlisted! Notification email sent.');
      setHrPipelineTab('shortlisted');
      if (hrSelectedJob) {
        viewCandidatesForJob(hrSelectedJob, 'shortlisted');
      }
      fetchDashboardStats();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleScheduleInterview = async (appId: number) => {
    setSchedulingInterview(appId);
    setInterviewDate('');
    setInterviewTime('');
  };

  const confirmScheduleInterview = async () => {
    if (!schedulingInterview) return;
    setLoading(true);
    showNotification('Scheduling interview & moving candidate to Interview stage...');
    try {
      const body: any = { status: 'interview' };
      if (interviewDate && interviewTime) {
        body.interview_time = `${interviewDate}T${interviewTime}:00Z`;
      }

      const res = await fetch(`${API_URL}/api/applications/${schedulingInterview}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to schedule interview');
      }

      showNotification('Interview scheduled! Candidate moved to Interview stage.');
      setSchedulingInterview(null);
      setHrPipelineTab('interview');
      if (hrSelectedJob) {
        viewCandidatesForJob(hrSelectedJob, 'interview');
      }
      fetchDashboardStats();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSelectCandidate = async (appId: number) => {
    setLoading(true);
    showNotification('Selecting candidate & sending selection email...');
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'selected' })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to select candidate');
      }

      showNotification('Candidate selected! Selection email sent.');
      setHrPipelineTab('selected');
      if (hrSelectedJob) {
        viewCandidatesForJob(hrSelectedJob, 'selected');
      }
      fetchDashboardStats();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (appId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!res.ok) throw new Error('Failed to delete application');
      showNotification('Candidate application permanently deleted from DB.');
      if (hrSelectedJob) {
        viewCandidatesForJob(hrSelectedJob, hrPipelineTab);
      }
      fetchDashboardStats();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCandidate = async (appId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to reject candidate');
      }
      showNotification('Candidate moved to rejected stage.');
      if (hrSelectedJob) {
        viewCandidatesForJob(hrSelectedJob, hrPipelineTab);
      }
      fetchDashboardStats();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async (appId: number) => {
    setLoading(true);
    showNotification('Re-sending email notification...');
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}/resend-email`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!res.ok) throw new Error('Email delivery failed');
      showNotification('Notification email sent successfully!');
      if (hrSelectedJob) {
        viewCandidatesForJob(hrSelectedJob, hrPipelineTab);
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async (resumeId: number, name: string) => {
    setViewingCandidateName(name);
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setViewingResumeText(data.raw_text || JSON.stringify(safeParseJson(data.parsed_data, {}), null, 2));
      }
    } catch (err) {
      showNotification('Could not load resume data', 'error');
    }
  };



  // ── Chatbot Panel Actions ──
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMessage = chatQuery;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatQuery('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: userMessage })
      });

      if (!res.ok) throw new Error('Chatbot response error');
      const data = await res.json();
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: data.reply, 
        sources: data.sources 
      }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error connecting to Groq. Make sure GROQ_API_KEY is defined in .env.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to render Application status stepper
  const renderApplicationTrackerStepper = (status: string) => {
    const steps = [
      { key: 'applied', label: 'Applied' },
      { key: 'screening', label: 'Screening' },
      { key: 'shortlisted', label: 'Shortlisted' },
      { key: 'interview', label: 'Interview' },
      { key: 'selected', label: 'Selected' },
    ];

    const currentIdx = status === 'selected' ? 4 : Math.max(0, steps.findIndex(s => s.key === status));

    return (
      <div className="w-full py-1">
        <div className="flex items-center justify-between relative w-full">
          {steps.map((step, idx) => {
            const isCompleted = status === 'selected' ? idx < 4 : idx < currentIdx;
            const isCurrent = status === 'selected' ? idx === 4 : idx === currentIdx;

            return (
              <React.Fragment key={step.key}>
                {/* Connecting Line */}
                {idx > 0 && (
                  <div
                    className={`flex-1 h-0.5 transition-all duration-300 mx-1 ${
                      idx <= currentIdx || status === 'selected' ? 'bg-[#1B6B63]' : 'bg-[#E4DFD3]'
                    }`}
                  />
                )}

                {/* Step Node */}
                <div className="flex flex-col items-center relative group">
                  <div
                    className={`flex items-center justify-center transition-all duration-200 ${
                      isCurrent
                        ? 'w-7 h-7 rounded-full bg-[#E8A33D] text-white font-extrabold text-[10px] shadow-md ring-2 ring-[#E8A33D]/25'
                        : isCompleted
                        ? 'w-6 h-6 rounded-full bg-[#1B6B63] text-white font-bold text-[10px] shadow-xs'
                        : 'w-6 h-6 rounded-full border-2 border-[#D4D3CC] bg-white text-[#9C9B95] font-semibold text-[10px]'
                    }`}
                  >
                    {isCompleted ? <Check size={12} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[9px] mt-1 font-medium capitalize tracking-tight whitespace-nowrap ${
                      isCurrent
                        ? 'text-[#C97E1F] font-extrabold'
                        : isCompleted
                        ? 'text-[#1B6B63] font-semibold'
                        : 'text-[#9C9B95]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };
  const calculateProfileCompletion = () => {
    let complete = 0;
    if (profile.full_name) complete++;
    if (profile.headline) complete++;
    if (profile.phone) complete++;
    if (profile.location) complete++;
    if (profile.skills) complete++;
    if (profile.experience_years > 0) complete++;
    return Math.round((complete / 6) * 100);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  useEffect(() => {
    if (user?.role === 'candidate') {
      fetchJobs();
      fetchMyResumes();
      fetchMyApplications();
    } else if (user?.role === 'hr') {
      fetchHrJobs();
      fetchDashboardStats();
    }
  }, [user?.role]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const renderStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : 'applied';
    if (s === 'selected') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1B6B63] text-white shadow-xs">
          Selected
        </span>
      );
    }
    if (s === 'screening') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FDF6EA] border border-[#F0C987] text-[#C97E1F]">
          Screening
        </span>
      );
    }
    if (s === 'shortlisted') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E8F4F2] border border-[#C8DFD9] text-[#1B6B63]">
          Shortlisted
        </span>
      );
    }
    if (s === 'interview') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFF6FF] border border-[#BFDBFE] text-blue-700">
          Interview Scheduled
        </span>
      );
    }
    return (
      <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F5F4EF] border border-[#E4DFD3] text-[#6B6A63]">
        {status || 'Applied'}
      </span>
    );
  };

  // ── Unauthenticated screen ──
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] text-[#1F2430] flex flex-col font-sans">
        {/* Portal switcher */}
        <div className="switcher-bar">
          <span>Viewing as</span>
          <button 
            className={`switch-btn ${portalMode === 'candidate' ? 'active' : ''}`}
            onClick={() => { setPortalMode('candidate'); setAuthRole('candidate'); }}
          >
            Candidate Portal
          </button>
          <button 
            className={`switch-btn ${portalMode === 'hr' ? 'active' : ''}`}
            onClick={() => { setPortalMode('hr'); setAuthRole('hr'); }}
          >
            HR Portal
          </button>
        </div>

        {/* Topnav */}
        <div className="topnav">
          <div className="logo">
            <div className="mark"><span>F</span></div>
            <div className="logo-text">
              Friday {portalMode === 'hr' && <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>— HR Console</span>}
            </div>
          </div>
          <div className="navlinks">
            <a className="current">{portalMode === 'candidate' ? 'Sign in / Sign up' : 'HR Portal Login'}</a>
          </div>
          <div className="avatar">{portalMode === 'candidate' ? 'RS' : 'HR'}</div>
        </div>

        {/* Auth form container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-[#E4DFD3] rounded-2xl p-8 shadow-sm relative">
            <div className="text-center mb-6">
              <div className="mark mx-auto mb-3" style={{ width: '42px', height: '42px', borderRadius: '11px' }}>
                <span style={{ fontSize: '20px' }}>F</span>
              </div>
              <h1 className="text-2xl font-bold text-[#1F2430]">Friday</h1>
              <p className="text-[#6B6A63] text-xs mt-1">Autonomous, AI-Powered Hiring platform</p>
            </div>

            {/* Two Explicit Role Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthRole('candidate');
                  setPortalMode('candidate');
                }}
                className={`py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authRole === 'candidate'
                    ? 'border-[#1B6B63] bg-[#E4F0EE] text-[#1B6B63] shadow-sm'
                    : 'border-[#E4DFD3] bg-[#FAF8F3] text-[#6B6A63] hover:bg-white'
                }`}
              >
                <span>Candidate Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthRole('hr');
                  setPortalMode('hr');
                }}
                className={`py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authRole === 'hr'
                    ? 'border-[#E8A33D] bg-[#FBF0DA] text-[#C97E1F] shadow-sm'
                    : 'border-[#E4DFD3] bg-[#FAF8F3] text-[#6B6A63] hover:bg-white'
                }`}
              >
                <span>HR Login</span>
              </button>
            </div>

            {notification && (
              <div className={`p-3 rounded-lg mb-4 text-xs flex items-center gap-2 border ${
                notification.type === 'success' 
                  ? 'bg-[#E4F0EE] border-[#1B6B63]/30 text-[#1B6B63]' 
                  : 'bg-[#FDF2F1] border-[#C1443C]/30 text-[#C1443C]'
              }`}>
                <AlertCircle size={14} />
                <span>{notification.message}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="Rhea Sharma"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E4DFD3] rounded-lg text-[#1F2430] text-sm focus:outline-none focus:border-[#1B6B63]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E4DFD3] rounded-lg text-[#1F2430] text-sm focus:outline-none focus:border-[#1B6B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E4DFD3] rounded-lg text-[#1F2430] text-sm focus:outline-none focus:border-[#1B6B63]"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-1">I am signing up as</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setAuthRole('candidate')}
                      className={`py-2.5 rounded-lg border text-xs font-bold transition ${
                        authRole === 'candidate'
                          ? 'border-[#1B6B63] bg-[#E4F0EE] text-[#1B6B63]'
                          : 'border-[#E4DFD3] bg-white text-[#6B6A63]'
                      }`}
                    >
                      Candidate
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRole('hr')}
                      className={`py-2.5 rounded-lg border text-xs font-bold transition ${
                        authRole === 'hr'
                          ? 'border-[#E8A33D] bg-[#FBF0DA] text-[#C97E1F]'
                          : 'border-[#E4DFD3] bg-white text-[#6B6A63]'
                      }`}
                    >
                      HR Manager
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-lg bg-[#E8A33D] hover:bg-[#d9942e] text-[#1F2430] font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs">
              <span className="text-[#6B6A63]">
                {isLogin ? "Don't have an account? " : "Already registered? "}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#1B6B63] font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </button>
            </div>

            {/* Quick Fill Demo Credentials */}
            <div className="mt-4 pt-4 border-t border-[#E4DFD3] text-center text-xs space-y-2">
              <span className="text-[#6B6A63] font-semibold block text-[11px]">Quick Fill Demo Account:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setAuthRole('hr');
                    setPortalMode('hr');
                    setAuthEmail('hr@gmail.com');
                    setAuthPassword('password');
                  }}
                  className="flex-1 py-1.5 bg-[#FAF8F3] hover:bg-[#F5F2E9] border border-[#E4DFD3] rounded-lg text-[11px] font-bold text-[#C97E1F] transition cursor-pointer"
                >
                  HR Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setAuthRole('candidate');
                    setPortalMode('candidate');
                    setAuthEmail('ca@gmail.com');
                    setAuthPassword('password');
                  }}
                  className="flex-1 py-1.5 bg-[#FAF8F3] hover:bg-[#F5F2E9] border border-[#E4DFD3] rounded-lg text-[11px] font-bold text-[#1B6B63] transition cursor-pointer"
                >
                  Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard / Portals (Authenticated) ──
  const isHR = user ? user.role === 'hr' : (portalMode === 'hr' || authRole === 'hr' || ['dashboard', 'jobs_hr'].includes(activeTab));
  const isCandidate = user ? user.role === 'candidate' : !isHR;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1F2430] font-sans flex flex-col relative pb-10">
      
      {/* Shared Topnav */}
      <div className="topnav">
        <div className="logo">
          <div className="mark"><span>F</span></div>
          <div className="logo-text">Friday</div>
          {isHR && <div className="logo-sub">— HR Console</div>}
          {isCandidate && <div className="logo-sub">— Candidate Portal</div>}
        </div>
        <div className="navlinks">
          {isCandidate && (
            <>
              <button type="button" className={activeTab === 'jobs' ? 'current' : ''} onClick={() => setActiveTab('jobs')}>Find jobs</button>
              <button type="button" className={activeTab === 'applications' ? 'current' : ''} onClick={() => setActiveTab('applications')}>My applications</button>
              <button type="button" className={activeTab === 'profile' ? 'current' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
            </>
          )}
          {isHR && (
            <>
              <button type="button" className={activeTab === 'dashboard' ? 'current' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
              <button type="button" className={activeTab === 'jobs_hr' ? 'current' : ''} onClick={() => setActiveTab('jobs_hr')}>Job postings</button>
              <button type="button" className={activeTab === 'candidates' ? 'current' : ''} onClick={() => setActiveTab('dashboard')}>Candidates & Pipeline</button>
            </>
          )}
        </div>
        <div className="account-cluster">
          <div 
            onClick={() => isCandidate ? setActiveTab('profile') : setActiveTab('dashboard')} 
            className="avatar cursor-pointer hover:opacity-85 transition"
            title={isCandidate ? "View Candidate Profile Settings" : "HR Dashboard"}
          >
            {user?.full_name 
              ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              : (isCandidate ? 'RS' : 'H')}
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Log out">
            ⏻
          </button>
        </div>
      </div>

      {/* Banner notification */}
      {notification && (
        <div className="mx-10 mt-4">
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success' 
              ? 'bg-[#E4F0EE] border-[#1B6B63]/30 text-[#1B6B63]' 
              : 'bg-[#FDF2F1] border-[#C1443C]/30 text-[#C1443C]'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-black">
              <X size={14} />
            </button>
          </div>
        </div>
      )}


      {/* ================= HR PORTAL (STRICTLY HR ROLE) ================= */}
      {isHR && (
        <div id="hr-view">
          {/* Week Pipeline Strip (Clickable Filter Tabs) */}
          <div className="pipeline">
            <div 
              className={`pipe-tab ${hrPipelineTab === 'applied' ? 'active-teal' : ''}`}
              onClick={() => viewCandidatesForJob(hrSelectedJob, 'applied')}
            >
              Applied ({dashboardData?.pipeline?.applied ?? 0})
            </div>
            <div 
              className={`pipe-tab ${hrPipelineTab === 'screening' ? 'active-teal' : ''}`}
              onClick={() => viewCandidatesForJob(hrSelectedJob, 'screening')}
            >
              Screening ({dashboardData?.pipeline?.screening ?? 0})
            </div>
            <div 
              className={`pipe-tab ${hrPipelineTab === 'shortlisted' ? 'active-teal' : ''}`}
              onClick={() => viewCandidatesForJob(hrSelectedJob, 'shortlisted')}
            >
              Shortlisted ({dashboardData?.pipeline?.shortlisted ?? 0})
            </div>
            <div 
              className={`pipe-tab ${hrPipelineTab === 'interview' ? 'active-teal' : ''}`}
              onClick={() => viewCandidatesForJob(hrSelectedJob, 'interview')}
            >
              Interview ({dashboardData?.pipeline?.interview ?? 0})
            </div>
            <div 
              className={`pipe-tab ${hrPipelineTab === 'selected' ? 'active-amber' : ''}`}
              onClick={() => viewCandidatesForJob(hrSelectedJob, 'selected')}
            >
              Selected ({dashboardData?.pipeline?.selected ?? 0})
            </div>
          </div>

          <div className="hr-body">
            <div className="stat-row">
              <div className="stat-card stat-card--ink"><div className="num">{dashboardData?.total_open_jobs ?? hrJobs.length}</div><div className="lbl">Open roles</div></div>
              <div className="stat-card stat-card--ink"><div className="num">{dashboardData?.total_applications ?? 0}</div><div className="lbl">Total applicants</div></div>
              <div className="stat-card stat-card--teal"><div className="num">{dashboardData?.pipeline?.shortlisted ?? 0}</div><div className="lbl">Shortlisted</div></div>
              <div className="stat-card stat-card--amber"><div className="num">{dashboardData?.pipeline?.selected ?? 0}</div><div className="lbl">Selected</div></div>
            </div>

            <div className="panel section-divider">
              <div className="panel-head">
                <div>
                  <h3>Candidates — <span className="stage-label capitalize">{hrPipelineTab} Stage</span></h3>
                  <div className="head-underline"></div>
                </div>

                <div className="head-right">
                  {/* Job Role Selector Dropdown */}
                  {hrJobs.length > 0 && (
                    <select
                      value={hrSelectedJob?.id || ''}
                      onChange={(e) => {
                        const selected = hrJobs.find(j => j.id === Number(e.target.value));
                        if (selected) viewCandidatesForJob(selected, hrPipelineTab);
                      }}
                      className="role-select"
                    >
                      {hrJobs.map(j => (
                        <option key={j.id} value={j.id}>{j.title} ({j.location})</option>
                      ))}
                    </select>
                  )}

                  {/* Candidate Search Bar */}
                  <input
                    type="text"
                    value={candidateSearchText}
                    onChange={(e) => setCandidateSearchText(e.target.value)}
                    placeholder="Search candidate name/email…"
                    className="search-input"
                  />

                  {hrSelectedJob && hrPipelineTab === 'applied' && (
                    <button 
                      onClick={handleBatchScreening}
                      className="screen-all-btn"
                      title="Run AI fit screening for all candidates"
                    >
                      <Sparkles size={12} className={loading ? 'sparkle-spinning' : ''} /> Screen All
                    </button>
                  )}
                </div>
              </div>
              <div className="cand-list">
                {jobCandidates.filter(cand => {
                  if (!candidateSearchText.trim()) return true;
                  const q = candidateSearchText.toLowerCase();
                  const name = (cand.candidate_name || cand.user?.full_name || '').toLowerCase();
                  const email = (cand.candidate_email || cand.user?.email || '').toLowerCase();
                  return name.includes(q) || email.includes(q);
                }).length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px', background: '#F4F1E8', borderRadius: '12px' }}>
                    <div className="empty-state-icon">
                      <Inbox size={20} />
                    </div>
                    <div className="empty-state-text">
                      No candidates found in <b>{hrPipelineTab}</b> stage.
                    </div>
                    <div className="empty-state-subtext">
                      Candidates will appear here as they progress through the recruitment pipeline.
                    </div>
                  </div>
                ) : (
                  jobCandidates.filter(cand => {
                    if (!candidateSearchText.trim()) return true;
                    const q = candidateSearchText.toLowerCase();
                    const name = (cand.candidate_name || cand.user?.full_name || '').toLowerCase();
                    const email = (cand.candidate_email || cand.user?.email || '').toLowerCase();
                    return name.includes(q) || email.includes(q);
                  }).map(cand => {
                    const displayName = cand.candidate_name || cand.user?.full_name || 'Candidate';
                    const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                    
                    return (
                      <div className="cand-card" key={cand.id}>
                        <div className="cc-avatar">{initials}</div>
                        <div className="cc-main">
                          <div className="cc-name cursor-pointer hover:underline text-[#1B6B63]" onClick={() => setViewingCandidateProfile(cand)}>
                            {displayName}
                          </div>
                          <div className="cc-email">{cand.candidate_email || cand.user?.email || 'Applicant'}</div>
                        </div>
                        <div className="cc-meta">
                          <div className="k">Applied</div>
                          <div className="v">{cand.applied_at ? new Date(cand.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}</div>
                        </div>
                        <div className="cc-score">
                          {cand.ai_score !== null ? (
                            <>
                              <div className="cc-score-track">
                                <div className="cc-score-fill" style={{ width: `${cand.ai_score}%` }}></div>
                              </div>
                              <div className="cc-score-text">{cand.ai_score} / 100</div>
                            </>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unscreened</span>
                          )}
                        </div>
                        <div className="cc-status">
                          <span className={`status-pill ${
                            cand.status === 'selected' ? 'bg-amber-100 text-amber-800' :
                            cand.status === 'shortlisted' ? 'bg-teal-100 text-teal-800' :
                            cand.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'applied'
                          }`}>
                            {cand.status === 'selected' ? (cand.email_sent === -1 ? 'Selected (Email fail)' : 'Selected') :
                             cand.status === 'shortlisted' ? (cand.email_sent === -1 ? 'Shortlisted (Email fail)' : 'Shortlisted') :
                             cand.status === 'rejected' ? 'Rejected' : cand.status}
                          </span>
                        </div>
                        <div className="cc-actions">
                          <button 
                            className="cc-icon profile" 
                            title="Profile" 
                            onClick={() => setViewingCandidateProfile(cand)}
                          >
                            <User size={15} />
                          </button>
                          {cand.resume_id && (
                            <button 
                              className="cc-icon view" 
                              title="View Resume"
                              onClick={() => handleViewResume(cand.resume_id, cand.candidate_name)}
                            >
                              <Eye size={15} />
                            </button>
                          )}

                          {cand.email_sent === -1 && (
                            <button 
                              className="cc-icon danger" 
                              title="Resend email"
                              onClick={() => handleResendEmail(cand.id)}
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}

                          {cand.status === 'applied' && (
                            <button 
                              className="cc-screen" 
                              title="Screen Candidate"
                              onClick={() => handleTriggerScreening(cand.id)}
                              disabled={screeningAppId === cand.id}
                            >
                              {screeningAppId === cand.id ? (
                                <><Loader2 size={13} className="animate-spin" /> Screening...</>
                              ) : (
                                <><Sparkles size={13} /> Screen</>
                              )}
                            </button>
                          )}
                          
                          {cand.status === 'screening' && (
                            <button 
                              className="cc-screen bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                              title="Shortlist"
                              onClick={() => handleShortlistCandidate(cand.id)}
                            >
                              <Sparkles size={13} /> Shortlist
                            </button>
                          )}

                          {cand.status === 'shortlisted' && (
                            <button 
                              className="cc-screen"
                              title="Schedule Interview"
                              onClick={() => handleScheduleInterview(cand.id)}
                            >
                              <Calendar size={13} /> Interview
                            </button>
                          )}

                          {cand.status === 'interview' && (
                            <button 
                              className="cc-screen"
                              title="Select Candidate"
                              onClick={() => handleFinalSelectCandidate(cand.id)}
                            >
                              <Check size={13} /> Select
                            </button>
                          )}

                          <button 
                            className="cc-icon danger" 
                            title="Reject Candidate"
                            onClick={() => handleRejectCandidate(cand.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>



            {/* Dashboard Footer */}
            <div className="dashboard-footer col-span-full">
              <span>Friday HR</span> · AI-Powered Hiring Console · {new Date().getFullYear()}
            </div>

          </div>
        </div>
      )}

        {activeTab === 'jobs' && user?.role === 'candidate' && (
          <div className="animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 px-4 sm:px-6 lg:px-8 pt-6 pb-10 min-h-[calc(100vh-64px)]" style={{ background: '#FAF8F3', color: '#1F2430' }}>

            {viewingJobDetail ? (
              /* ── DEDICATED JOB DETAIL PAGE ── */
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Back Button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setViewingJobDetail(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E4DFD3] hover:border-[#1F2430] text-[#1F2430] rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <ArrowLeft size={16} /> ← Back to jobs
                  </button>
                  <span className="text-xs text-[#9C9B95] font-medium">Job Ref #{viewingJobDetail.id}</span>
                </div>

                {/* Header Card */}
                <div className="bg-white border border-[#E4DFD3] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#E8F4F2] border border-[#C8DFD9] flex items-center justify-center text-[#1B6B63] shrink-0 font-bold text-xl shadow-inner">
                        <Building2 size={28} />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] leading-tight mb-2">
                          {viewingJobDetail.title}
                        </h1>
                        <p className="text-sm font-semibold text-[#1F2430] mb-3">
                          {viewingJobDetail.company_name || viewingJobDetail.department || 'Friday HR Verified Employer'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#6B6A63]">
                          <span className="flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-1.5 rounded-lg border border-[#E4DFD3] text-[#1F2430] font-medium">
                            <MapPin size={14} className="text-[#1B6B63]" />
                            {viewingJobDetail.location || 'Remote'}
                          </span>
                          <span className="flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-1.5 rounded-lg border border-[#E4DFD3] text-[#1F2430] font-medium">
                            <Briefcase size={14} className="text-[#C97E1F]" />
                            {formatExperienceYears(viewingJobDetail.experience_min, viewingJobDetail.experience_max)}
                          </span>
                          <span className="flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-1.5 rounded-lg border border-[#E4DFD3] text-[#1F2430] font-medium">
                            <Clock size={14} className="text-blue-600" />
                            {viewingJobDetail.job_type || 'Full Time'}
                          </span>
                          {(viewingJobDetail.salary_min > 0 || viewingJobDetail.salary_max > 0) && (
                            <span className="flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-1.5 rounded-lg border border-[#E4DFD3] text-[#1F2430] font-semibold">
                              ${viewingJobDetail.salary_min || 80}k - ${viewingJobDetail.salary_max || 120}k / yr
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Apply & Save) */}
                    <div className="flex flex-row md:flex-col items-stretch gap-3 shrink-0">
                      {myApplications.some(app => app.job_id === viewingJobDetail.id) ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="w-full text-center px-6 py-3 rounded-xl bg-[#E8F4F2] border-2 border-[#1B6B63] text-[#1B6B63] font-bold text-sm flex items-center justify-center gap-2">
                            <Check size={16} /> Applied
                          </span>
                          <span className="text-[11px] font-bold text-[#1B6B63] uppercase tracking-wider">
                            Status: {myApplications.find(app => app.job_id === viewingJobDetail.id)?.status || 'Applied'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSelectedJob(viewingJobDetail); setIsApplying(true); }}
                          className="px-8 py-3 bg-[#C97E1F] hover:bg-[#B06E18] text-white font-bold text-sm rounded-xl shadow-md transition active:scale-[0.97] cursor-pointer"
                        >
                          Apply Now
                        </button>
                      )}

                      <button
                        onClick={() => toggleSaveJob(viewingJobDetail.id)}
                        className={`px-5 py-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          savedJobIds.includes(viewingJobDetail.id)
                            ? 'bg-[#1F2430] border-[#1F2430] text-white'
                            : 'bg-white border-[#E4DFD3] text-[#1F2430] hover:bg-[#FAF8F3]'
                        }`}
                      >
                        <Bookmark size={14} className={savedJobIds.includes(viewingJobDetail.id) ? 'fill-current' : ''} />
                        {savedJobIds.includes(viewingJobDetail.id) ? 'Saved' : 'Save Job'}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E4DFD3] text-center sm:text-left">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#9C9B95] font-bold block mb-1">Posted Date</span>
                      <span className="text-xs font-semibold text-[#1F2430]">
                        {viewingJobDetail.created_at ? new Date(viewingJobDetail.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently Posted'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#9C9B95] font-bold block mb-1">Open Positions</span>
                      <span className="text-xs font-semibold text-[#1F2430] flex items-center gap-1 justify-center sm:justify-start">
                        <Users size={13} className="text-[#1B6B63]" /> {viewingJobDetail.openings || 2} Openings
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#9C9B95] font-bold block mb-1">Applicants</span>
                      <span className="text-xs font-semibold text-[#1F2430]">
                        {viewingJobDetail.applicant_count || 12} Candidates
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Highlights Card */}
                <div className="bg-white border border-[#E4DFD3] rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1F2430]">
                    <Sparkles size={16} className="text-[#C97E1F]" />
                    <h3>Job Highlights</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-[#1F2430] list-disc list-inside leading-relaxed pl-1">
                    <li>Experience required: {formatExperienceYears(viewingJobDetail.experience_min, viewingJobDetail.experience_max)} in relevant tech domain.</li>
                    <li>Core technical stack: {safeParseJson(viewingJobDetail.skills_required, ['Engineering skills']).slice(0, 4).join(', ')}.</li>
                    <li>Role location: {viewingJobDetail.location || 'Remote'} ({viewingJobDetail.job_type || 'Full Time'}).</li>
                  </ul>
                </div>

                {/* Job Description Card */}
                <div className="bg-white border border-[#E4DFD3] rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1F2430]">
                    <FileText size={16} className="text-[#1B6B63]" />
                    <h3>Job Description</h3>
                  </div>
                  <p className="text-xs text-[#1F2430] leading-relaxed whitespace-pre-line">
                    {viewingJobDetail.description || 'We are seeking a dedicated professional to join our team. In this role, you will lead key software features, collaborate with cross-functional team members, and deliver reliable solutions.'}
                  </p>

                  <div className="pt-3 border-t border-[#E4DFD3]">
                    <h4 className="text-xs font-bold text-[#1F2430] mb-2">Key Responsibilities:</h4>
                    <ul className="space-y-1.5 text-xs text-[#6B6A63] list-disc list-inside leading-relaxed">
                      <li>Design, build, and deploy reliable software services and user features.</li>
                      <li>Collaborate effectively with product and architecture teams.</li>
                      <li>Perform code reviews, optimize performance, and write clean documentation.</li>
                      <li>Participate in agile sprint planning and technical problem solving.</li>
                    </ul>
                  </div>
                </div>

                {/* Skills Required Card */}
                <div className="bg-white border border-[#E4DFD3] rounded-2xl p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-[#1F2430]">Skills & Competencies Required</h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {safeParseJson(viewingJobDetail.skills_required, ['Python', 'FastAPI', 'React']).map((skill: string) => (
                      <span
                        key={skill}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#E8F4F2] text-[#1B6B63] border border-[#C8DFD9]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── JOB GRID VIEW ── */
              <>
                {/* Search Bar (Keyword + Location + Search) */}
                <form
                  onSubmit={(e) => { e.preventDefault(); fetchJobs(); }}
                  className="flex flex-col sm:flex-row items-stretch bg-white border border-[#E4DFD3] rounded-3xl sm:rounded-full p-1.5 focus-within:border-[#E8A33D] focus-within:shadow-[0_0_0_3px_rgba(232,163,61,0.15)] transition-all duration-300 group max-w-4xl mx-auto mb-8"
                >
                  {/* Left section: keyword */}
                  <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
                    <Search size={18} className="text-[#6B6A63] group-focus-within:text-[#1F2430] shrink-0 transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Job title, keywords, or company"
                      className="w-full bg-transparent border-none text-[15px] text-[#1F2430] placeholder-[#6B6A63] focus:outline-none focus:ring-0 px-3"
                    />
                  </div>

                  {/* Vertical Divider (Desktop) */}
                  <div className="hidden sm:block w-[1px] h-8 bg-[#E4DFD3] my-auto self-center"></div>
                  
                  {/* Horizontal Divider (Mobile) */}
                  <div className="sm:hidden h-[1px] w-full bg-[#E4DFD3] my-1"></div>

                  {/* Middle section: location */}
                  <div className="sm:w-[280px] flex items-center px-3 sm:px-4 py-2 sm:py-0">
                    <MapPin size={18} className="text-[#6B6A63] group-focus-within:text-[#1F2430] shrink-0 transition-colors" />
                    <input
                      type="text"
                      value={locFilter}
                      onChange={e => setLocFilter(e.target.value)}
                      placeholder="Enter location"
                      className="w-full bg-transparent border-none text-[15px] text-[#1F2430] placeholder-[#6B6A63] focus:outline-none focus:ring-0 px-3"
                    />
                  </div>

                  {/* Right section: button */}
                  <button
                    type="submit"
                    className="mt-2 sm:mt-0 flex items-center justify-center px-8 py-3.5 sm:py-0 bg-[#1F2430] hover:bg-[#2d3548] text-white text-[15px] font-bold rounded-2xl sm:rounded-full transition-all active:scale-[0.97] shrink-0 cursor-pointer shadow-sm"
                  >
                    Find jobs
                  </button>
                </form>

                {/* 3-Column Layout: Filters | Job Grid | My Application */}
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_240px] gap-6 max-w-7xl mx-auto">

                  {/* LEFT SIDEBAR — Filter Checkboxes */}
                  <div className="bg-white border border-[#E4DFD3] rounded-2xl p-5 h-fit shadow-sm">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#6B6A63] mb-4">Experience</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: '0–2 years', val: 2 },
                        { label: '2–5 years', val: 5 },
                        { label: '5+ years', val: 10 },
                      ].map(opt => {
                        const isChecked = expFilters.includes(opt.val);
                        return (
                          <label key={opt.val} className="flex items-center gap-2.5 cursor-pointer text-sm text-[#1F2430] hover:text-[#1B6B63] transition group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${isChecked ? 'bg-[#1B6B63] border-[#1B6B63] shadow-[0_0_8px_2px_rgba(27,107,99,0.4)]' : 'bg-white border-[#E4DFD3] group-hover:border-[#1B6B63]'}`}>
                              {isChecked && <Check size={12} color="white" strokeWidth={3} />}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setExpFilters(prev => isChecked ? prev.filter(v => v !== opt.val) : [...prev, opt.val])}
                              className="hidden"
                            />
                            <span className={isChecked ? 'font-semibold text-[#1B6B63]' : ''}>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#6B6A63] mt-6 mb-4">Job Type</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Full-time', val: 'full-time' },
                        { label: 'Remote', val: 'remote' },
                        { label: 'Contract', val: 'contract' },
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-2.5 cursor-pointer text-sm text-[#1F2430] hover:text-[#1B6B63] transition">
                          <input
                            type="checkbox"
                            checked={typeFilter === opt.val}
                            onChange={() => setTypeFilter(typeFilter === opt.val ? '' : opt.val)}
                            className="w-4 h-4 rounded border-[#E4DFD3] accent-[#1B6B63] cursor-pointer"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* CENTER — Double Column Job Cards */}
                  <div>
                    {jobs.filter(job => {
                      if (expFilters.length === 0) return true;
                      return expFilters.some(val => {
                        const maxExp = job.experience_max ?? 0;
                        if (val === 2) return maxExp <= 2;
                        if (val === 5) return maxExp > 2 && maxExp <= 5;
                        if (val === 10) return maxExp > 5;
                        return false;
                      });
                    }).length === 0 ? (
                      <div className="bg-white border border-[#E4DFD3] border-dashed rounded-2xl p-12 text-center">
                        <Briefcase size={36} className="mx-auto text-[#C4C3BC] mb-3" />
                        <h3 className="text-base font-bold text-[#1F2430]">No matching jobs found</h3>
                        <p className="text-xs text-[#6B6A63] mt-1">Try broadening your search or filter criteria.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {jobs.filter(job => {
                          if (expFilters.length === 0) return true;
                          return expFilters.some(val => {
                            const maxExp = job.experience_max ?? 0;
                            if (val === 2) return maxExp <= 2;
                            if (val === 5) return maxExp > 2 && maxExp <= 5;
                            if (val === 10) return maxExp > 5;
                            return false;
                          });
                        }).map(job => {
                          const isApplied = myApplications.some(app => app.job_id === job.id);
                          const skills = safeParseJson(job.skills_required, []);
                          return (
                            <div
                              key={job.id}
                              onClick={() => setViewingJobDetail(job)}
                              className="bg-white border border-[#E4DFD3] hover:border-[#C97E1F]/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[180px] relative group cursor-pointer"
                            >
                              {/* Top content */}
                              <div className="flex-1">
                                <h4
                                  className="text-[15px] font-bold text-[#1F2430] leading-snug hover:text-[#1B6B63] transition line-clamp-2 mb-1.5"
                                >
                                  {job.title}
                                </h4>
                                <p className="text-xs text-[#6B6A63] mb-3 leading-relaxed">
                                  <span className="font-semibold text-[#1F2430]">{job.company_name || job.department || 'Friday HR'}</span>
                                  {' · '}{job.location || 'Remote'}
                                  {' · '}{formatExperienceYears(job.experience_min, job.experience_max)}
                                </p>

                                {/* Skill Tags */}
                                <div className="flex flex-wrap gap-1.5">
                                  {skills.slice(0, 4).map((skill: string) => (
                                    <span
                                      key={skill}
                                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#E8F4F2] text-[#1B6B63] border border-[#C8DFD9]"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {skills.length > 4 && (
                                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F4EF] text-[#6B6A63]">
                                      +{skills.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Bottom row */}
                              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E4DFD3]">
                                <span className="text-[10px] text-[#9C9B95] font-medium">
                                  {job.created_at ? `Posted ${new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Posted recently'}
                                </span>
                                {isApplied ? (
                                  <span
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-lg bg-white border-2 border-[#1B6B63] text-[#1B6B63]"
                                  >
                                    <Check size={13} /> Applied
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedJob(job);
                                      setIsApplying(true);
                                    }}
                                    className="text-xs font-bold px-4 py-1.5 rounded-lg bg-[#C97E1F] hover:bg-[#B06E18] text-white shadow-sm transition active:scale-[0.96] cursor-pointer"
                                  >
                                    Apply now
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* RIGHT SIDEBAR — My Application Status & Recommended */}
                  <div className="flex flex-col gap-5">
                    {/* 1. My Applications Summary */}
                    <div className="bg-white border border-[#E7E2D6] rounded-[14px] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[13px] font-bold text-[#1F2430]">My Applications</h3>
                        {myApplications.length > 0 && (
                          <span className="bg-[#E4F0EE] text-[#1B6B63] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#C8DFD9]">
                            {myApplications.length}
                          </span>
                        )}
                      </div>
                      
                      {myApplications.length === 0 ? (
                        <div className="text-center py-2">
                          <p className="text-xs text-[#6B6A63] mb-3">You haven't applied to any jobs yet — browse open roles to get started.</p>
                          <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-[11px] font-bold text-[#1B6B63] hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            Browse open roles
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myApplications.slice(0, isMyAppsExpanded ? myApplications.length : 3).map(app => (
                            <div key={app.id} className="flex flex-col gap-1 pb-3 border-b border-[#E4DFD3] last:border-0 last:pb-0">
                              <span className="text-xs font-bold text-[#1F2430] truncate" title={app.job_title}>{app.job_title || 'Application'}</span>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-[#9C9B95] font-medium">
                                  {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                                  app.status === 'selected' ? 'bg-[#FBF0DA] text-[#C97E1F] border border-[#F3D7A4]' : 
                                  app.status === 'shortlisted' ? 'bg-[#E4F0EE] text-[#1B6B63] border border-[#C8DFD9]' : 
                                  app.status === 'screening' ? 'bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF]' :
                                  'bg-[#F5F4EF] text-[#6B6A63] border border-[#E4DFD3]'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                            </div>
                          ))}
                          {myApplications.length > 3 && (
                            <button
                              onClick={() => setIsMyAppsExpanded(!isMyAppsExpanded)}
                              className="w-full text-center text-[14px] font-bold text-[#1F2430] bg-transparent border border-[#e5e7eb] rounded-[10px] py-2.5 hover:bg-[#f3f4f6] transition cursor-pointer mt-2"
                            >
                              {isMyAppsExpanded ? 'See less' : 'See more'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Recommended for You */}
                    <div className="bg-white border border-[#E7E2D6] rounded-[14px] p-5">
                      <h3 className="text-[16px] font-bold text-[#1F2430] mb-2">Recommended for you</h3>
                      <div className="space-y-3">
                        {(() => {
                          const userSkills = (profile.skills || '').toLowerCase();
                          const recs = jobs
                            .filter(j => !myApplications.some(a => a.job_id === j.id))
                            .map(j => {
                              const req = safeParseJson(j.skills_required, []);
                              const matchCount = req.filter((s: string) => userSkills.includes(s.toLowerCase())).length;
                              return { ...j, matchCount };
                            })
                            .sort((a, b) => b.matchCount - a.matchCount)
                            .slice(0, 3);
                          
                          if (recs.length === 0) return <p className="text-[13px] text-[#6b7280]">No recommendations right now.</p>;
                          
                          return recs.map(job => (
                            <div 
                              key={job.id} 
                              onClick={() => setViewingJobDetail(job)}
                              className="group cursor-pointer pb-3 border-b border-[#E4DFD3] last:border-0 last:pb-0"
                            >
                              <div className="text-xs font-bold text-[#1F2430] group-hover:text-[#1B6B63] transition line-clamp-1">{job.title}</div>
                              <div className="text-[10px] text-[#6B6A63] mt-1 font-medium">{job.company_name || 'Friday HR'} · {job.location || 'Remote'}</div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* 3. Candidate Profile Quick Access Card */}
                    <div className="bg-white border border-[#E7E2D6] rounded-[14px] p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[12px] font-bold uppercase text-gray-500 tracking-[0.06em]">My Profile</h4>
                        <span className="text-[12px] font-bold text-[#4338ca] bg-[#eef2ff] px-2.5 py-0.5 rounded-full">
                          {calculateProfileCompletion()}%
                        </span>
                      </div>
                      <p className="text-[14px] font-bold text-[#1F2430] mt-2.5">
                        {profile.full_name || user?.full_name || 'maggi'}
                      </p>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* CANDIDATE TAB: MY PROFILE                               */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'profile' && user?.role === 'candidate' && (
          <div className="animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 px-4 sm:px-6 lg:px-8 pt-6 pb-12 min-h-[calc(100vh-64px)]" style={{ background: '#FAF8F3', color: '#1F2430' }}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Edit Details Form */}
              <div className="lg:col-span-2 bg-white border border-[#E4DFD3] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-2xl font-extrabold text-[#1F2430]">Profile Settings</h2>

                {/* Profile Completion Meter */}
                {(() => {
                  const completion = calculateProfileCompletion();
                  return (
                    <div className="p-5 bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#6B6A63] uppercase tracking-wider">Profile Strength</span>
                        <span className="text-sm font-extrabold text-[#1B6B63]">
                          {completion}%
                        </span>
                      </div>
                      
                      {/* Teal Progress Track */}
                      <div className="w-full h-2.5 bg-[#E4DFD3] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1B6B63] rounded-full transition-all duration-700 shadow-xs"
                          style={{ width: `${completion}%` }}
                        />
                      </div>

                      {/* Checklist Items */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          { label: 'Name', done: !!profile.full_name },
                          { label: 'Headline', done: !!profile.headline },
                          { label: 'Phone', done: !!profile.phone },
                          { label: 'Location', done: !!profile.location },
                          { label: 'Skills', done: !!profile.skills },
                          { label: 'Experience', done: profile.experience_years > 0 },
                          { label: 'Resume', done: candidateResumes.length > 0 },
                        ].map(item => (
                          <span key={item.label} className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border transition ${
                            item.done ? 'bg-[#E8F4F2] border-[#C8DFD9] text-[#1B6B63]' : 'bg-[#F5F4EF] border-[#E4DFD3] text-[#9C9B95]'
                          }`}>
                            {item.done ? <Check size={13} /> : <span className="text-[10px]">○</span>} {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                <form onSubmit={updateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profile.full_name}
                        onChange={e => setProfile({...profile, full_name: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-[#E4DFD3] rounded-xl text-sm font-medium text-[#1F2430] placeholder-[#9C9B95] focus:outline-none focus:border-[#1B6B63] transition shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Headline</label>
                      <input
                        type="text"
                        value={profile.headline}
                        placeholder="e.g. Senior Software Engineer at Friday Inc."
                        onChange={e => setProfile({...profile, headline: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-[#E4DFD3] rounded-xl text-sm font-medium text-[#1F2430] placeholder-[#9C9B95] focus:outline-none focus:border-[#1B6B63] transition shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={profile.phone}
                        placeholder="+1 (555) 000-0000"
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-[#E4DFD3] rounded-xl text-sm font-medium text-[#1F2430] placeholder-[#9C9B95] focus:outline-none focus:border-[#1B6B63] transition shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Location</label>
                      <input
                        type="text"
                        value={profile.location}
                        placeholder="City, Country"
                        onChange={e => setProfile({...profile, location: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-[#E4DFD3] rounded-xl text-sm font-medium text-[#1F2430] placeholder-[#9C9B95] focus:outline-none focus:border-[#1B6B63] transition shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={profile.experience_years}
                        onChange={e => setProfile({...profile, experience_years: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-white border border-[#E4DFD3] rounded-xl text-sm font-medium text-[#1F2430] placeholder-[#9C9B95] focus:outline-none focus:border-[#1B6B63] transition shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Skills (comma separated)</label>
                      <input
                        type="text"
                        value={profile.skills}
                        placeholder="React, TypeScript, Node.js, Python"
                        onChange={e => setProfile({...profile, skills: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-[#E4DFD3] rounded-xl text-sm font-medium text-[#1F2430] placeholder-[#9C9B95] focus:outline-none focus:border-[#1B6B63] transition shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 bg-[#1F2430] hover:bg-[#2d3548] text-white text-sm font-bold rounded-xl shadow-md transition active:scale-[0.97] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Save Profile Settings
                  </button>
                </form>
              </div>

              {/* Right Column: My Resumes */}
              <div className="bg-white border border-[#E4DFD3] rounded-2xl p-6 shadow-sm h-fit space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2430] mb-1">My Resumes</h3>
                  <p className="text-[#6B6A63] text-xs mb-4 leading-relaxed">Upload PDF, DOC, or DOCX formats (Max 10MB). Uploading parses content automatically.</p>
                  
                  <label className="border-2 border-dashed border-[#E4DFD3] hover:border-[#1B6B63] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-[#FAF8F3] transition group">
                    <Upload size={28} className="text-[#1B6B63] group-hover:scale-110 transition mb-2" />
                    <span className="text-xs font-bold text-[#1F2430]">Upload new resume</span>
                    <span className="text-[11px] text-[#9C9B95] mt-0.5">PDF, DOCX up to 10MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Documents List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#6B6A63] uppercase tracking-wider">Uploaded Documents ({candidateResumes.length})</h4>
                  {candidateResumes.length === 0 ? (
                    <p className="text-[#9C9B95] text-xs italic">No resumes uploaded yet.</p>
                  ) : (
                    candidateResumes.map((res, idx) => {
                      const isPrimary = primaryResumeId ? primaryResumeId === res.id : idx === 0;
                      return (
                        <div key={res.id} className="bg-white border border-[#E4DFD3] hover:border-[#C8DFD9] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-xs transition">
                          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                            <FileText size={18} className="text-[#1B6B63] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[#1F2430] font-bold truncate block" title={res.file_name}>
                                {res.file_name}
                              </span>
                              <span className="text-[10px] text-[#9C9B95]">
                                {res.created_at ? new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Uploaded'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Primary Badge or Set Primary */}
                            {isPrimary ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4F2] text-[#1B6B63] border border-[#C8DFD9]">
                                Primary
                              </span>
                            ) : (
                              <button
                                onClick={() => setPrimaryResumeId(res.id)}
                                className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F4EF] text-[#6B6A63] hover:bg-[#E8F4F2] hover:text-[#1B6B63] transition cursor-pointer"
                                title="Mark as primary default resume"
                              >
                                Set Primary
                              </button>
                            )}

                            {/* Download Icon Button */}
                            <a
                              href={`${API_URL}/api/resumes/${res.id}/download`}
                              className="p-1.5 text-[#6B6A63] hover:text-[#1F2430] hover:bg-[#F5F4EF] rounded-lg transition"
                              title="Download file"
                            >
                              <FileDown size={15} />
                            </a>

                            {/* Delete Icon Button */}
                            <button
                              onClick={() => handleDeleteResume(res.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete resume permanently"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* CANDIDATE TAB: MY APPLICATIONS                          */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'applications' && user?.role === 'candidate' && (
          <div className="animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 px-4 sm:px-6 lg:px-8 pt-6 pb-12 min-h-[calc(100vh-64px)]" style={{ background: '#FAF8F3', color: '#1F2430' }}>
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Page Header */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2430] leading-tight">Application Status Tracker</h1>
                <p className="text-sm text-[#6B6A63] mt-1">Track where each of your active applications stands in the hiring process.</p>
              </div>

              {myApplications.length === 0 ? (
                <div className="bg-white border border-[#E4DFD3] border-dashed rounded-2xl p-12 text-center max-w-xl mx-auto">
                  <CheckCircle2 size={40} className="mx-auto text-[#C4C3BC] mb-3" />
                  <h3 className="text-[#1F2430] font-bold text-base mb-1">No active applications</h3>
                  <p className="text-[#6B6A63] text-xs">Browse open roles in the Find Jobs tab to submit your application.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {myApplications.map(app => (
                    <div key={app.id} className="bg-white border border-[#E4DFD3] hover:border-[#C97E1F]/40 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4">
                      
                      {/* Top Header: Title + Date + Status Badge & Fit Score */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-base font-bold text-[#1F2430] leading-snug line-clamp-1">{app.job_title}</h3>
                            <p className="text-[11px] text-[#9C9B95] font-medium mt-0.5">
                              Applied on {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {renderStatusBadge(app.status)}
                            {app.ai_score !== null && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F3E8FF] border border-[#E9D5FF] text-[#6B21A8] rounded-md inline-flex items-center gap-1">
                                <Sparkles size={10} className="text-[#9333EA]" />
                                {app.ai_score}/100
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Stepper */}
                      <div className="py-2 border-t border-b border-[#E4DFD3]/60">
                        {renderApplicationTrackerStepper(app.status)}
                      </div>

                      {/* Scheduled Interview Alert */}
                      {app.interview_time && (
                        <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[11px] flex items-center justify-between gap-2 text-[#1F2430]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Calendar size={14} className="text-blue-600 shrink-0" />
                            <span className="font-semibold text-blue-700 truncate">{new Date(app.interview_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {app.interview_link && (
                            <a
                              href={app.interview_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[10px] shrink-0"
                            >
                              Join
                            </a>
                          )}
                        </div>
                      )}

                      {/* AI Assessment Summary Box */}
                      <div className="bg-[#F4F1E8] border border-[#E4DFD3] rounded-xl p-3 text-[11px] space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#6B6A63] flex items-center gap-1">
                          <Sparkles size={10} className="text-[#C97E1F]" />
                          AI RECRUITER ASSESSMENT
                        </span>
                        <p className="text-[#1F2430] leading-snug line-clamp-2">
                          {app.ai_summary || "Candidate profile demonstrates relevant core skills and alignment with role qualifications."}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* CANDIDATE TAB: NOTIFICATIONS                            */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'notifications' && user?.role === 'candidate' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h2>

            {myApplications.length === 0 ? (
              <div className="bg-slate-900/10 border border-slate-900 border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto">
                <Bell size={40} className="mx-auto text-slate-700 mb-4" />
                <h3 className="text-slate-400 font-semibold mb-1">No notifications</h3>
                <p className="text-slate-600 text-xs">You'll see updates about your applications here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {myApplications
                  .filter(app => app.status !== 'applied')
                  .map(app => (
                  <div key={app.id} className={`p-4 rounded-2xl border flex items-start gap-4 ${
                    app.status === 'interview' ? 'bg-emerald-950/20 border-emerald-900/30'
                    : app.status === 'rejected' ? 'bg-rose-950/20 border-rose-900/30'
                    : app.status === 'screening' ? 'bg-indigo-950/20 border-indigo-900/30'
                    : 'bg-slate-900/30 border-slate-800/50'
                  }`}>
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      app.status === 'interview' ? 'bg-emerald-950 text-emerald-400'
                      : app.status === 'rejected' ? 'bg-rose-950 text-rose-400'
                      : 'bg-indigo-950 text-indigo-400'
                    }`}>
                      {app.status === 'interview' ? <Calendar size={16} /> : app.status === 'rejected' ? <X size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-bold">{app.job_title}</h4>
                      <p className="text-slate-400 text-xs mt-1">
                        {app.status === 'interview' ? `You've been selected! Interview scheduled.`
                         : app.status === 'rejected' ? 'Application was not selected for this role.'
                         : app.status === 'screening' ? 'Your resume is being evaluated by AI screening.'
                         : app.status === 'shortlisted' ? 'Congratulations! You have been shortlisted.'
                         : `Status updated to: ${app.status}`}
                      </p>
                      {app.interview_time && (
                        <p className="text-blue-400 text-xs mt-1 flex items-center gap-1">
                          <Clock size={10} /> {new Date(app.interview_time).toLocaleString()}
                        </p>
                      )}
                      <span className="text-slate-600 text-[10px] mt-2 block">
                        {app.updated_at ? new Date(app.updated_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {myApplications.filter(app => app.status !== 'applied').length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-sm">All applications are still in "Applied" status. Updates will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* HR TAB: JOB POSTINGS                                    */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'jobs_hr' && isHR && (
          <div className="panel space-y-4 my-6">
            <div className="panel-head flex items-center justify-between">
              <div>
                <h3 className="section-title" style={{ fontSize: '18px', margin: 0 }}>Job Postings</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Manage open and closed job positions</p>
              </div>
              <button 
                onClick={() => setIsPostingJob(true)}
                className="create-job-btn"
              >
                <Plus size={16} />
                Create Job
              </button>
            </div>

            {hrJobs.length === 0 ? (
              <div className="p-12 text-center border border-[#E4DFD3] rounded-2xl bg-white my-4">
                <Briefcase size={36} className="mx-auto text-[#6B6A63] mb-3" />
                <h3 className="text-base font-bold text-[#1F2430]">No job positions posted yet</h3>
                <p className="text-xs text-[#6B6A63] mt-1">Click <b>'+ Create Job'</b> above to add one.</p>
              </div>
            ) : (
              <table style={{ width: '100%', marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Applicants count</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hrJobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div className="cand-name">{job.title}</div>
                        <div className="cand-sub">{job.department || 'Engineering'}</div>
                      </td>
                      <td>{job.location}</td>
                      <td className="mono">{job.experience_min ?? 0}–{job.experience_max ?? 4} yrs</td>
                      <td className="mono font-bold" style={{ textAlign: 'center' }}>{job.application_count ?? 0}</td>
                      <td>
                        <span className={job.status === 'open' ? 'badge-status-open' : 'badge-status-closed'}>
                          {job.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button 
                            className="job-action-btn" 
                            title="View / Edit Job" 
                            onClick={() => { setViewingJobDetail(job); }}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className={`select-btn ${job.status === 'open' ? 'danger' : ''}`}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => handleToggleJobStatus(job.id, job.status)}
                          >
                            {job.status === 'open' ? 'Close role' : 'Reopen role'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* CANDIDATE APPLY MODAL                                    */}
      {/* ──────────────────────────────────────────────────────── */}
      {isApplying && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 relative animate-scale-in">
            <button
              onClick={() => {
                setIsApplying(false);
                setSelectedJob(null);
              }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Apply to {selectedJob.title}</h3>
              <p className="text-slate-500 text-xs mt-1">Submit your application to Friday HR.</p>
            </div>

            {candidateResumes.length === 0 ? (
              <div className="border-2 border-slate-800 border-dashed rounded-2xl p-6 text-center space-y-4">
                <FileText size={32} className="mx-auto text-slate-600" />
                <div>
                  <h4 className="text-slate-400 text-sm font-semibold">You need a resume to apply</h4>
                  <p className="text-slate-600 text-xs mt-1">Upload a PDF or Word document in profile settings or directly below.</p>
                </div>
                
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition">
                  <Upload size={14} />
                  Upload Resume
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Resume</label>
                  <select
                    value={selectedResumeId || ''}
                    onChange={e => setSelectedResumeId(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
                  >
                    {candidateResumes.map(r => (
                      <option key={r.id} value={r.id}>{r.file_name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-slate-400 leading-relaxed">
                    By submitting, your resume parsed details, education, and skills will be indexed in our search and evaluated for JD match.
                  </span>
                </div>

                {applyError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                    {applyError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsApplying(false);
                      setSelectedJob(null);
                    }}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl tracking-wide transition text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {loading ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* JOB DETAIL MODAL (CANDIDATE / HR)                       */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewingJobDetail && (
        <div className="fixed inset-0 z-50 bg-[#1F2430]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4DFD3] w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-6 relative animate-scale-in max-h-[90vh] overflow-y-auto text-[#1F2430]">
            <button onClick={() => setViewingJobDetail(null)} className="absolute right-4 top-4 text-[#6B6A63] hover:text-[#1F2430]">
              <X size={20} />
            </button>

            {/* 1. Header Card */}
            <div className="bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl p-5 relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#1F2430]">{viewingJobDetail.title}</h2>
                  <p className="text-sm font-semibold text-[#1B6B63] mt-0.5">
                    {viewingJobDetail.department || 'Friday HR Partner'} · {viewingJobDetail.location || 'Remote'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6A63] mt-3">
                    <span className="font-semibold text-[#1F2430]">💼 {viewingJobDetail.experience_min ?? 0}–{viewingJobDetail.experience_max ?? 4} yrs exp</span>
                    {viewingJobDetail.salary_min && (
                      <span className="font-semibold text-[#1B6B63]">💰 ${viewingJobDetail.salary_min}k – ${viewingJobDetail.salary_max}k/yr</span>
                    )}
                    <span>📍 {viewingJobDetail.location || 'Flexible'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-[#E4F0EE] border border-[#1B6B63]/20 flex items-center justify-center text-[#1B6B63] font-bold text-xl ml-auto">
                    {viewingJobDetail.title[0]}
                  </div>
                  <a href="#similar" onClick={(e) => { e.preventDefault(); showNotification('Subscribed to similar job alerts!'); }} className="text-[11px] text-[#1B6B63] font-semibold hover:underline block mt-2">
                    Send me jobs like this
                  </a>
                </div>
              </div>

              <div className="border-t border-[#E4DFD3] mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-[#6B6A63] gap-2">
                <div className="flex items-center gap-4">
                  <span>📅 {viewingJobDetail.created_at ? `Posted ${new Date(viewingJobDetail.created_at).toLocaleDateString()}` : 'Posted recently'}</span>
                  <span>👥 {viewingJobDetail.application_count ?? 0} Applicants</span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => showNotification('Job saved to your bookmarks!')} 
                    className="px-3 py-1.5 border border-[#E4DFD3] rounded-lg text-xs font-semibold hover:bg-white transition"
                  >
                    🔖 Save
                  </button>
                  {myApplications.some(app => app.job_id === viewingJobDetail.id) ? (
                    <button className="px-4 py-1.5 bg-[#E4F0EE] text-[#1B6B63] border border-[#1B6B63]/30 font-bold rounded-lg text-xs cursor-default">
                      Applied ✓
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setSelectedJob(viewingJobDetail); setIsApplying(true); setViewingJobDetail(null); }}
                      className="px-5 py-1.5 bg-[#E8A33D] hover:bg-[#d9942e] text-[#1F2430] font-bold rounded-lg text-xs transition"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Candidate Job Match Score Row */}
            {isCandidate && (
              <div className="bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl p-4">
                <h4 className="text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-3">Job Match Insights</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Early Applicant */}
                  <div className="p-2.5 bg-white border border-[#E4DFD3] rounded-lg flex items-center gap-2">
                    <span>⚡</span>
                    <div>
                      <span className="font-bold block text-[11px]">Early Applicant</span>
                      <span className="text-[10px] font-semibold text-[#1B6B63]">{(viewingJobDetail.application_count ?? 0) < 10 ? '✅ High Priority' : '❌ Popular Job'}</span>
                    </div>
                  </div>

                  {/* Key Skills */}
                  <div className="p-2.5 bg-white border border-[#E4DFD3] rounded-lg flex items-center gap-2">
                    <span>🎯</span>
                    <div>
                      <span className="font-bold block text-[11px]">Key Skills Match</span>
                      <span className="text-[10px] font-semibold text-[#1B6B63]">
                        {(() => {
                          const reqSkills = safeParseJson(viewingJobDetail.skills_required, []);
                          const userSkills = (profile.skills || '').toLowerCase();
                          const matches = reqSkills.filter((s: string) => userSkills.includes(s.toLowerCase()));
                          return matches.length > 0 ? `✅ ${matches.length} Matched` : '❌ Need Skills';
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="p-2.5 bg-white border border-[#E4DFD3] rounded-lg flex items-center gap-2">
                    <span>📍</span>
                    <div>
                      <span className="font-bold block text-[11px]">Location Fit</span>
                      <span className="text-[10px] font-semibold text-[#1B6B63]">
                        {(viewingJobDetail.location || '').toLowerCase().includes('remote') || (profile.location && (viewingJobDetail.location || '').toLowerCase().includes(profile.location.toLowerCase())) ? '✅ Matched' : '❌ Different City'}
                      </span>
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="p-2.5 bg-white border border-[#E4DFD3] rounded-lg flex items-center gap-2">
                    <span>💼</span>
                    <div>
                      <span className="font-bold block text-[11px]">Experience Fit</span>
                      <span className="text-[10px] font-semibold text-[#1B6B63]">
                        {profile.experience_years >= (viewingJobDetail.experience_min ?? 0) ? '✅ Meets Range' : '❌ Under Experience'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Job Highlights Card */}
            <div className="bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl p-4">
              <h4 className="text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Job Highlights</h4>
              <ul className="space-y-1.5 text-xs text-[#1F2430]">
                {safeParseJson(viewingJobDetail.highlights, [
                  `Requires proficiency in: ${safeParseJson(viewingJobDetail.skills_required, ['Python', 'FastAPI']).join(', ')}`,
                  `Experience min: ${viewingJobDetail.experience_min ?? 0} years`
                ]).map((hl: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#1B6B63] font-bold">•</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Job Description & Key Responsibilities */}
            <div className="space-y-4 text-xs leading-relaxed text-[#1F2430]">
              <div>
                <h4 className="text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Job Overview</h4>
                <p className="whitespace-pre-line">{viewingJobDetail.description}</p>
              </div>

              {viewingJobDetail.responsibilities && (
                <div>
                  <h4 className="text-xs font-bold text-[#6B6A63] uppercase tracking-wider mb-2">Key Responsibilities</h4>
                  <p className="whitespace-pre-line bg-[#FAF8F3] p-3 rounded-lg border border-[#E4DFD3]">{viewingJobDetail.responsibilities}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4 border-t border-[#E4DFD3]">
              <button onClick={() => setViewingJobDetail(null)} className="flex-1 py-2.5 bg-white border border-[#E4DFD3] text-[#6B6A63] hover:text-[#1F2430] rounded-xl font-bold transition text-xs">
                Close
              </button>
              {myApplications.some(app => app.job_id === viewingJobDetail.id) ? (
                <button disabled className="flex-1 py-2.5 bg-[#E4F0EE] text-[#1B6B63] font-bold rounded-xl text-xs">
                  Applied ✓
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedJob(viewingJobDetail);
                    setIsApplying(true);
                    setViewingJobDetail(null);
                  }}
                  className="flex-1 py-2.5 bg-[#E8A33D] hover:bg-[#d9942e] text-[#1F2430] font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* HR POST JOB FORM MODAL                                   */}
      {/* ──────────────────────────────────────────────────────── */}
      {isPostingJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E2D6] w-full max-w-lg rounded-[16px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] space-y-6 relative animate-scale-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsPostingJob(false)} className="absolute right-4 top-4 text-[#6B7280] hover:text-[#0F6B5C] transition-colors">
              <X size={20} />
            </button>

            <div>
              <h3 className="text-xl font-bold text-[#1F2430]">Create New Job Posting</h3>
              <p className="text-[#6B7280] text-xs mt-1">Publish an active role on the candidate board.</p>
            </div>

            <form onSubmit={handlePostJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Job Title</label>
                  <input 
                    type="text" 
                    required 
                    value={newJob.title} 
                    onChange={e => {
                      setNewJob({...newJob, title: e.target.value});
                      setIsTitleDropdownOpen(true);
                    }} 
                    onFocus={() => setIsTitleDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsTitleDropdownOpen(false), 200)}
                    placeholder="e.g. Full-Stack Developer" 
                    className={`w-full px-4 py-2.5 bg-[#FAF9F5] border rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all ${isTitleDropdownOpen ? 'border-[#0F6B5C] shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)]' : 'border-[#E7E2D6]'}`}
                  />
                  {isTitleDropdownOpen && newJob.title.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl max-h-48 overflow-y-auto shadow-[0_4px_20px_rgba(0,0,0,0.1)] py-1">
                      {IT_JOB_TITLES.filter(t => t.toLowerCase().includes(newJob.title.toLowerCase())).map(title => (
                        <li 
                          key={title} 
                          className="px-4 py-2 text-sm text-[#1E2430] hover:bg-[#0F6B5C] hover:text-white cursor-pointer transition-colors"
                          onClick={() => {
                            const mapping = JOB_MAPPINGS[title];
                            setNewJob({
                              ...newJob, 
                              title, 
                              ...(mapping ? {
                                department: mapping.dept,
                                skills_required: mapping.skills,
                                experience_min: mapping.min,
                                experience_max: mapping.max
                              } : {})
                            });
                            setIsTitleDropdownOpen(false);
                          }}
                        >
                          {title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Department</label>
                  <input type="text" required value={newJob.department} onChange={e => setNewJob({...newJob, department: e.target.value})} placeholder="e.g. Engineering" className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Location</label>
                  <input 
                    type="text" 
                    required 
                    value={newJob.location} 
                    onChange={e => {
                      setNewJob({...newJob, location: e.target.value});
                      setIsLocDropdownOpen(true);
                    }} 
                    onFocus={() => setIsLocDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsLocDropdownOpen(false), 200)}
                    placeholder="e.g. Chennai, Bangalore" 
                    className={`w-full px-4 py-2.5 bg-[#FAF9F5] border rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all ${isLocDropdownOpen ? 'border-[#0F6B5C] shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)]' : 'border-[#E7E2D6]'}`}
                  />
                  {isLocDropdownOpen && (
                    <ul className="absolute z-10 w-full mt-1 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl max-h-48 overflow-y-auto shadow-[0_4px_20px_rgba(0,0,0,0.1)] py-1">
                      {(() => {
                        const locParts = newJob.location.split(',').map(s => s.trim());
                        const currentLocSearch = locParts[locParts.length - 1] || '';
                        const filteredLocs = IT_LOCATIONS.filter(l => l.toLowerCase().includes(currentLocSearch.toLowerCase()) && !locParts.includes(l));
                        if (filteredLocs.length === 0) return <li className="px-4 py-2 text-sm text-[#6B7280]">No matching cities</li>;
                        
                        return filteredLocs.map(loc => (
                          <li 
                            key={loc} 
                            className="px-4 py-2 text-sm text-[#1E2430] hover:bg-[#0F6B5C] hover:text-white cursor-pointer transition-colors"
                            onClick={() => {
                              const newLocs = [...locParts.slice(0, -1), loc].filter(Boolean).join(', ');
                              setNewJob({...newJob, location: newLocs + (newLocs ? ', ' : '')});
                              setIsLocDropdownOpen(false);
                            }}
                          >
                            {loc}
                          </li>
                        ));
                      })()}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Job Type</label>
                  <select value={newJob.job_type} onChange={e => setNewJob({...newJob, job_type: e.target.value})} className="w-full px-3 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] transition-all">
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Min Salary (k/yr)</label>
                  <input type="number" required value={newJob.salary_min === '' ? '' : newJob.salary_min} onChange={e => setNewJob({...newJob, salary_min: e.target.value === '' ? '' : Number(e.target.value)})} placeholder="e.g. 80" className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Max Salary (k/yr)</label>
                  <input type="number" required value={newJob.salary_max === '' ? '' : newJob.salary_max} onChange={e => setNewJob({...newJob, salary_max: e.target.value === '' ? '' : Number(e.target.value)})} placeholder="e.g. 120" className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Min Experience (yrs)</label>
                  <input type="number" required value={newJob.experience_min === '' ? '' : newJob.experience_min} onChange={e => setNewJob({...newJob, experience_min: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Max Experience (yrs)</label>
                  <input type="number" required value={newJob.experience_max === '' ? '' : newJob.experience_max} onChange={e => setNewJob({...newJob, experience_max: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Required Skills (comma separated)</label>
                <input type="text" required value={newJob.skills_required} onChange={e => setNewJob({...newJob, skills_required: e.target.value})} placeholder="React, Node.js, Python, SQL" className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all" />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.06em] mb-2">Job Description</label>
                <textarea required rows={4} value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} placeholder="Describe roles, responsibilities, and benefits..." className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#E7E2D6] rounded-xl text-[#1E2430] focus:outline-none focus:border-[#0F6B5C] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.35)] focus:invalid:border-[#d99a3d] focus:invalid:shadow-[0_0_0_1px_#d99a3d,0_0_8px_2px_rgba(217,154,61,0.4)] placeholder:text-[#9CA3AF] transition-all resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsPostingJob(false)} className="flex-1 py-2.5 bg-white border border-[#E7E2D6] text-[#1E2430] hover:bg-[#FAF9F5] rounded-xl font-bold transition">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#0F6B5C] hover:bg-[#14806f] text-white font-bold rounded-xl tracking-wide transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_2px_rgba(15,107,92,0.25)] hover:shadow-[0_0_18px_4px_rgba(15,107,92,0.4)]">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Post Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* RESUME VIEW MODAL                                        */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewingResumeText !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 relative animate-scale-in">
            <button onClick={() => setViewingResumeText(null)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">{viewingCandidateName}'s Resume Text</h3>
              <p className="text-slate-500 text-xs mt-1">Raw parsed content saved in database.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl overflow-y-auto max-h-[50vh] border border-slate-900">
              <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{viewingResumeText}</pre>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setViewingResumeText(null)} className="px-5 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition text-xs">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* AI SCREENING DETAILS MODAL                               */}
      {/* ──────────────────────────────────────────────────────── */}
      {screeningDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 relative animate-scale-in max-h-[85vh] overflow-y-auto">
            <button onClick={() => setScreeningDetails(null)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{screeningDetails.candidate_name || 'Candidate'} screening log</h3>
                <span className="text-slate-500 text-xs font-semibold">Evaluation for: {screeningDetails.job_title}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall JD Fit Score:</span>
                <span className="text-lg font-extrabold text-purple-400 bg-purple-950/40 border border-purple-900/40 px-3 py-1 rounded-xl">
                  {screeningDetails.ai_score !== undefined ? screeningDetails.ai_score : screeningDetails.score}/100
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Key Strengths</span>
                <ul className="space-y-1.5 text-xs text-emerald-400">
                  {safeParseJson(screeningDetails.ai_strengths || screeningDetails.strengths).map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 bg-emerald-950/20 border border-emerald-900/20 p-2 rounded-lg">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Gaps / Improvement Areas</span>
                <ul className="space-y-1.5 text-xs text-rose-400">
                  {safeParseJson(screeningDetails.ai_gaps || screeningDetails.gaps).map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 bg-rose-950/20 border border-rose-900/20 p-2 rounded-lg">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Fit Evaluation Summary</span>
                <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-900 leading-relaxed">
                  {screeningDetails.ai_summary || screeningDetails.summary}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setScreeningDetails(null)} className="px-5 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition text-xs">
                Close Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* INTERVIEW SCHEDULING MODAL                               */}
      {/* ──────────────────────────────────────────────────────── */}
      {schedulingInterview !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 relative animate-scale-in">
            <button onClick={() => setSchedulingInterview(null)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Schedule Interview</h3>
                <span className="text-slate-500 text-xs font-semibold">Move candidate to Interview stage & schedule date/time</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Interview Date</label>
                <input 
                  type="date" 
                  value={interviewDate} 
                  onChange={e => setInterviewDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Interview Time</label>
                <input 
                  type="time" 
                  value={interviewTime} 
                  onChange={e => setInterviewTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-blue-400 flex items-start gap-2">
                <Link size={14} className="shrink-0 mt-0.5" />
                <span>A unique meeting link will be auto-generated. The candidate will move to the Interview stage.</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setSchedulingInterview(null)} className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition text-sm">
                Cancel
              </button>
              <button
                onClick={confirmScheduleInterview}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl tracking-wide transition text-sm flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Confirm & Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* CANDIDATE PROFILE DETAILS MODAL (HR VIEW)                 */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewingCandidateProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4DFD3] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative animate-scale-in text-[#1F2430]">
            <button 
              onClick={() => setViewingCandidateProfile(null)} 
              className="absolute right-5 top-5 text-[#9C9B95] hover:text-[#1F2430] p-1 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-4 pb-4 border-b border-[#E4DFD3]">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F4F2] border border-[#C8DFD9] flex items-center justify-center text-[#1B6B63] font-bold text-xl shrink-0">
                {(viewingCandidateProfile.candidate_name || viewingCandidateProfile.user?.full_name || 'C')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#1F2430]">
                  {viewingCandidateProfile.candidate_name || viewingCandidateProfile.user?.full_name || 'Candidate Profile'}
                </h3>
                <p className="text-xs text-[#6B6A63] mt-0.5">
                  {viewingCandidateProfile.user?.headline || viewingCandidateProfile.candidate_email || 'Applicant'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 bg-[#E8F4F2] text-[#1B6B63] border border-[#C8DFD9] rounded-md capitalize">
                    Stage: {viewingCandidateProfile.status}
                  </span>
                  {viewingCandidateProfile.ai_score !== null && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF] rounded-md flex items-center gap-1">
                      <Sparkles size={11} /> AI Fit: {viewingCandidateProfile.ai_score}/100
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#9C9B95] block mb-1">Email Address</span>
                <span className="font-semibold text-[#1F2430] break-all">{viewingCandidateProfile.candidate_email || viewingCandidateProfile.user?.email || 'N/A'}</span>
              </div>
              <div className="p-3 bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#9C9B95] block mb-1">Phone Number</span>
                <span className="font-semibold text-[#1F2430]">{viewingCandidateProfile.user?.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#9C9B95] block mb-1">Location</span>
                <span className="font-semibold text-[#1F2430]">{viewingCandidateProfile.user?.location || 'Not specified'}</span>
              </div>
              <div className="p-3 bg-[#FAF8F3] border border-[#E4DFD3] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#9C9B95] block mb-1">Experience</span>
                <span className="font-semibold text-[#1F2430]">
                  {viewingCandidateProfile.user?.experience_years != null ? `${viewingCandidateProfile.user.experience_years} years` : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6A63]">Skills & Technical Stack</h4>
              <div className="flex flex-wrap gap-1.5">
                {safeParseJson(viewingCandidateProfile.user?.skills, []).length > 0 ? (
                  safeParseJson(viewingCandidateProfile.user?.skills, []).map((sk: string) => (
                    <span key={sk} className="text-xs font-semibold px-3 py-1 bg-[#E8F4F2] text-[#1B6B63] border border-[#C8DFD9] rounded-full">
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9C9B95] italic">No skills listed</span>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-2 border-t border-[#E4DFD3]">
              {viewingCandidateProfile.resume_id && (
                <button
                  onClick={() => {
                    const resId = viewingCandidateProfile.resume_id;
                    const candName = viewingCandidateProfile.candidate_name;
                    setViewingCandidateProfile(null);
                    handleViewResume(resId, candName);
                  }}
                  className="flex-1 py-2.5 bg-[#1B6B63] hover:bg-[#15544E] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  👁 View Resume Document
                </button>
              )}
              <button
                onClick={() => setViewingCandidateProfile(null)}
                className="flex-1 py-2.5 bg-[#FAF8F3] border border-[#E4DFD3] text-[#1F2430] hover:bg-[#E4DFD3]/40 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ──────────────────────────────────────────────────────── */}
      {/* FLOATING HR CHATBOT TOGGLE BUTTON                        */}
      {/* ──────────────────────────────────────────────────────── */}
      {user?.role === 'hr' && (
        <>
          <style>{`
            @keyframes pulseGlow {
              0%, 100% { box-shadow: 0 0 6px 1px rgba(15,107,92,0.3); }
              50% { box-shadow: 0 0 12px 4px rgba(15,107,92,0.55); }
            }
            .animate-pulse-glow {
              animation: pulseGlow 2s ease-in-out infinite;
            }
          `}</style>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="fixed bottom-7 right-7 bg-[#0f6b5c] text-white rounded-full px-6 py-3.5 font-bold text-[13px] tracking-[.03em] flex items-center gap-2 shadow-[0_0_14px_3px_rgba(15,107,92,0.35)] hover:shadow-[0_0_20px_5px_rgba(15,107,92,0.5)] hover:scale-[1.03] transition-all z-[9998] cursor-pointer"
          >
            <Sparkles size={16} />
            <span className="hidden md:inline">FRIDAY AI CO-PILOT</span>
          </button>
        </>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* CHATBOT DRAWER PANEL                                     */}
      {/* ──────────────────────────────────────────────────────── */}
      {chatOpen && user?.role === 'hr' && (
        <div className="fixed bottom-[100px] right-7 w-[360px] max-w-[90vw] bg-white border border-[#e7e2d6] rounded-[18px] shadow-[0_20px_50px_rgba(15,107,92,0.08),0_4px_18px_rgba(0,0,0,0.06)] flex flex-col z-[9999] overflow-hidden animate-slide-up max-h-[500px]">
          {/* Header */}
          <div className="flex items-start gap-3 p-[18px_18px_16px] border-b border-[#e7e2d6] bg-white relative">
            <div className="w-[38px] h-[38px] rounded-xl bg-[#e8f3f1] flex items-center justify-center shrink-0 shadow-[0_0_8px_2px_rgba(15,107,92,0.4)] animate-pulse-glow">
              <Sparkles className="w-5 h-5 text-[#0f6b5c]" />
            </div>
            <div>
              <h4 className="m-0 text-[15px] text-[#1e2430] font-bold">Friday HR Assistant</h4>
              <p className="m-[2px_0_0] text-[12px] text-[#6b7280]">Powered by Groq API</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="absolute top-4 right-4 bg-transparent border-none text-[#6b7280] text-[18px] cursor-pointer hover:text-[#0f6b5c] transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {/* Chat Logs */}
          <div className="flex-1 p-[18px] min-h-[160px] overflow-y-auto bg-white space-y-4">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-[14px_16px] rounded-[14px] max-w-[85%] text-[13.5px] leading-relaxed ${ 
                  chat.sender === 'user' 
                    ? 'bg-[#0f6b5c] text-white rounded-br-sm' 
                    : 'bg-[#f7f5ee] text-[#1e2430] rounded-bl-sm border border-[#e7e2d6]'
                }`}>
                  <p className="whitespace-pre-line">{chat.text}</p>
                </div>
                
                {chat.sources && chat.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center pl-1">
                    <span className="text-[10px] text-[#6b7280] uppercase font-bold tracking-wider mr-1">Sources:</span>
                    {chat.sources.map((src: any, sIdx: number) => (
                      <span 
                        key={sIdx}
                        onClick={() => {
                          if (src.resume_id) {
                            handleViewResume(src.resume_id, src.name);
                          }
                        }}
                        className="text-[10px] font-bold bg-[#f7f5ee] border border-[#e7e2d6] hover:border-[#0f6b5c] hover:bg-[#e8f3f1] text-[#0f6b5c] px-2 py-1 rounded-md cursor-pointer transition-all shadow-sm"
                      >
                        {src.name} (Match: {src.score})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#f7f5ee] border border-[#e7e2d6] rounded-[14px] rounded-bl-sm p-[14px_16px] flex items-center gap-2 max-w-[85%]">
                  <Loader2 size={14} className="animate-spin text-[#0f6b5c] shrink-0" />
                  <span className="text-[13.5px] text-[#6b7280]">Friday is typing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form message input */}
          <form onSubmit={handleSendChatMessage} className="flex items-center gap-[10px] p-[14px_16px] border-t border-[#e7e2d6] bg-white">
            <input
              type="text"
              value={chatQuery}
              onChange={e => setChatQuery(e.target.value)}
              placeholder="Ask Friday e.g. 'Show React candidates'"
              className="flex-1 bg-[#f7f5ee] border border-[#e7e2d6] rounded-xl p-[10px_14px] text-[13.5px] text-[#1e2430] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#0f6b5c] focus:shadow-[0_0_0_1px_#0F6B5C,0_0_10px_3px_rgba(15,107,92,0.3)]"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatQuery.trim()}
              className="w-[38px] h-[38px] rounded-full bg-[#0f6b5c] border-none flex items-center justify-center cursor-pointer shrink-0 shadow-[0_0_8px_2px_rgba(15,107,92,0.3)] transition-all hover:shadow-[0_0_12px_3px_rgba(15,107,92,0.45)] active:shadow-[0_0_20px_6px_rgba(15,107,92,0.7)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} className="text-white relative right-[1px] top-[1px]" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
