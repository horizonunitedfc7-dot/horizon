"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Country, State } from 'country-state-city';
import Select from 'react-select';
import { X, Check, ArrowLeft, Upload, Eye, EyeOff } from "lucide-react";
import { gsap } from "gsap";

// High-End Select Styling
const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: state.isFocused ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    minHeight: '56px',
    borderRadius: '1rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.3)'
    }
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: '#050505',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    zIndex: 9999,
  }),
  menuList: (provided: any) => ({
    ...provided,
    padding: '4px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,215,0,0.3) transparent',
    '&::-webkit-scrollbar': { width: '6px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,215,0,0.3)', borderRadius: '3px' },
    '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,215,0,0.5)' },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'rgba(255, 255, 255, 0.1)' : state.isFocused ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    color: state.isSelected ? '#fff' : '#a1a1aa',
    cursor: 'pointer',
    padding: '12px 16px',
    borderRadius: '0.5rem',
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#fff'
  }),
  input: (provided: any) => ({
    ...provided,
    color: '#fff'
  }),
  indicatorSeparator: () => ({ display: 'none' })
};

export default function RegistrationFlow({ playerType }: { playerType: 'ACADEMIC' | 'SCHOLARSHIP' }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isRejected, setIsRejected] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const filterRef = useRef<any>(null);
  const [registrationFee, setRegistrationFee] = useState(15000);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [flwKey, setFlwKey] = useState("");
  const [registeredId, setRegisteredId] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}/api/fees`)
      .then(res => res.json())
      .then(data => {
        const regFee = data.find((f: any) => f.key === 'registration' || f.category === 'REGISTRATION');
        if (regFee) setRegistrationFee(regFee.amount);
      })
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}/api/config/flutterwave`)
      .then(res => res.json())
      .then(data => {
        if (data.publicKey) setFlwKey(data.publicKey);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (filterRef.current) {
      gsap.to(filterRef.current, {
        attr: { baseFrequency: "0.01 0.03" },
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, []);

  const [selectedCountryCode, setSelectedCountryCode] = useState("NG");
  const [isMounted, setIsMounted] = useState(false);

  // Verification Documents State
  const [releasedFromClub, setReleasedFromClub] = useState("on");
  const [parentConsent, setParentConsent] = useState("on");
  const [receiptFileName, setReceiptFileName] = useState('');

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedDialCode, setSelectedDialCode] = useState<{value:string, label:string, iso:string}>({ value: '+234', label: '+234', iso: 'NG' });

  useEffect(() => setIsMounted(true), []);

  const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }];
  const positionOptions = [{ value: 'Goalkeeper', label: 'Goalkeeper' }, { value: 'Defender', label: 'Defender' }, { value: 'Midfielder', label: 'Midfielder' }, { value: 'Forward', label: 'Forward' }];
  const footOptions = [{ value: 'Right', label: 'Right' }, { value: 'Left', label: 'Left' }, { value: 'Both', label: 'Both' }];
  const bloodGroupOptions = [{ value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }];
  const genotypeOptions = [{ value: 'AA', label: 'AA' }, { value: 'AS', label: 'AS' }, { value: 'SS', label: 'SS' }, { value: 'AC', label: 'AC' }, { value: 'SC', label: 'SC' }];

  const totalSteps = 6;
  const countries = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
  const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode).map(s => ({ value: s.name, label: s.name })) : [];
  const dialCodeOptions = Country.getAllCountries()
    .map(c => {
      const code = c.phonecode.replace(/^\+/, '').split(' ')[0].split('-')[0].split(',')[0];
      return { value: `+${code}`, label: `+${code}`, iso: c.isoCode };
    })
    .filter((opt, i, arr) => arr.findIndex(o => o.value === opt.value) === i);

  const formatDialCodeLabel = (option: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={`https://flagcdn.com/w20/${option.iso?.toLowerCase()}.png`} alt="" width={20} height={14} style={{ borderRadius: '2px', objectFit: 'cover' }} />
      <span>{option.label}</span>
    </div>
  );

  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCheckingEmail) return;
    setError("");

    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const data = Object.fromEntries(formData.entries());

      // Pre-Qualification Logic (Step 1)
      if (currentStep === 1) {
        if (data.hasHealthIssues === 'on' || data.releasedFromClub === 'off' || data.parentConsent === 'off') {
          setIsRejected(true);
          return;
        }
        if (!data.firstname || !data.lastname || !data.email || !data.password || !data.passportPhoto) {
          setError("Please fill all required fields in this step.");
          return;
        }
        if ((data.password as string).length < 6) {
          setError("Password must be at least 6 characters long.");
          return;
        }

        setIsCheckingEmail(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}/api/check-email?email=${encodeURIComponent(data.email as string)}`);
          if (res.ok) {
            const result = await res.json();
            if (result.exists) {
              setError("Email is already registered. Please log in instead.");
              setIsCheckingEmail(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error checking email", err);
        }
        setIsCheckingEmail(false);
      } 
      if (currentStep === 2) {
        if (!data.age || !data.nationality || !data.state || !data.address || !data.mobile || !data.gender) {
          setError("Please fill all demographics fields.");
          return;
        }
        const age = parseInt(data.age as string);
        if (isNaN(age)) {
          setError("Please enter a valid age.");
          return;
        }
        if (playerType === 'ACADEMIC' && (age < 7 || age > 30)) {
          setError("Academic players must be between 7 and 30 years old.");
          return;
        }
        if (playerType === 'SCHOLARSHIP' && (age < 10 || age > 35)) {
          setError("Scholarship players must be between 10 and 35 years old.");
          return;
        }
      }
      if (currentStep === 3) {
        if (!data.position || !data.foot || !data.height || !data.weight || !data.experience) {
           setError("Please fill all football profile fields.");
           return;
        }
        const exp = parseInt(data.experience as string);
        if (isNaN(exp) || exp < 0) {
           setError("Experience must be a valid number of years.");
           return;
        }
      }
      if (currentStep === 4) {
        if (!data.bloodgroup || !data.genotype || !data.emergencynumber) {
           setError("Please fill all medical information fields.");
           return;
        }
      }
      if (currentStep === 5) {
        if (!data.institute || !data.classlevel || !data.guardianname || !data.relationship || !data.guardianmobile || !data.guardianaddress) {
           setError("Please fill all education and guardian fields.");
           return;
        }
      }
    }

    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submissionData = new FormData(e.currentTarget);
    submissionData.append("playerType", playerType);

    setIsProcessing(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}/api/applicants`, {
        method: "POST",
        body: submissionData,
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.applicant?.regno) {
          setRegisteredId(responseData.applicant.regno);
        }
        setIsSuccess(true);
      } else {
        const errData = await res.json();
        alert(`Failed to submit application: ${errData.error}`);
      }
    } catch (err) {
      alert("Server error saving applicant. Please try again later.");
    }
    
    setIsProcessing(false);
  };

  if (isRejected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-[#050505] border border-white/10 p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center transform scale-95 animate-[scaleUp_0.5s_ease-out_forwards]">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Application Rejected</h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Unfortunately, based on our strict academy rules, we cannot accept your application if you have health issues, lack parent consent, or have not been officially released from your former club. You have not been charged.
          </p>
          <button onClick={() => window.location.href = '/'} className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-full transition-all">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    const whatsappLink = playerType === 'ACADEMIC' 
      ? 'https://chat.whatsapp.com/FlTHuzkGd26BNzW2OTJDWs?mode=gi_t'
      : 'https://chat.whatsapp.com/Fo4Lra9NBeS6NvSajUquTk?mode=gi_t';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-brand-black border border-brand-white/10 p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center transform scale-95 animate-[scaleUp_0.5s_ease-out_forwards] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-gold to-[#E6C200]"></div>
          <div className="w-20 h-20 bg-brand-gold/20 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10" strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold text-brand-white mb-4 tracking-tight">Under Review</h2>
          
          {registeredId && (
            <div className="bg-[#111] border border-brand-white/10 rounded-2xl p-4 mb-6 shadow-inner">
              <p className="text-sm text-gray-400 mb-1">Your Registration ID</p>
              <p className="text-2xl font-mono text-brand-gold tracking-widest font-bold">{registeredId}</p>
            </div>
          )}

          <p className="text-gray-400 leading-relaxed mb-6 text-lg">
            Your {playerType.toLowerCase()} application and payment have been received. Please join the official WhatsApp group for further instructions and updates on your status.
          </p>

          <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-4 mb-8 text-left">
            <p className="text-brand-white/90 text-sm leading-relaxed">
              <span className="font-bold text-brand-gold">Important:</span> You can now log into your player dashboard using your Registration ID (or Email) and the password you created during registration.
            </p>
          </div>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => router.push('/login'), 500)} className="block w-full bg-brand-gold hover:bg-[#E6C200] text-brand-black font-bold py-4 rounded-full transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            Join Official WhatsApp Group &#8599;
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-black text-brand-white flex flex-col items-center pt-24 pb-32 px-4 relative overflow-hidden font-sans">
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />
      
      {/* Dynamic GSAP Flag Background */}
      <svg className="hidden">
        <filter id="flag-ripple">
          <feTurbulence ref={filterRef} type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ 
          backgroundImage: "url('/horizon_flag_bg.png')",
          filter: "url(#flag-ripple)",
          transform: "scale(1.1)"
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-brand-black/40 via-brand-black/70 to-brand-black pointer-events-none" />

      <div className="w-full max-w-3xl z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Return Home
        </Link>
        
        <div className="mb-16 text-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] uppercase tracking-[0.2em] font-medium text-gray-400 mb-6">
            Phase {currentStep} of {totalSteps}
          </div>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-4">
            {playerType === 'ACADEMIC' ? 'Academic Enrollment' : 'Scholarship Trial'}
          </h1>
          <p className="text-gray-400 text-lg">Complete the form to submit your application to Horizon United FC.</p>
        </div>

        {/* The Double-Bezel Shell */}
        <div className="p-2 rounded-[2.5rem] bg-brand-white/[0.02] border border-brand-white/5 shadow-2xl backdrop-blur-xl">
          {/* The Inner Core */}
          <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" className="bg-brand-black rounded-[calc(2.5rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-8 md:p-12">
            

            {/* STEP 1: Pre-Qualification & Basics */}
            <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${currentStep === 1 ? 'opacity-100 translate-y-0 block' : 'hidden opacity-0 translate-y-8'}`}>
              <h3 className="text-2xl font-medium mb-8 pb-4 border-b border-white/10">Pre-Qualification & Account</h3>
              
              <div className="space-y-6 mb-8 p-6 bg-red-900/10 border border-red-500/20 rounded-2xl">
                <p className="text-red-400 text-sm font-medium mb-4 uppercase tracking-wider">Mandatory Requirements</p>
                <div className="flex items-center justify-between">
                  <label className="text-gray-300">Do you have any underlying health issues?</label>
                  <select name="hasHealthIssues" className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2">
                    <option value="off">No</option>
                    <option value="on">Yes</option>
                  </select>
                </div>
                {playerType === 'SCHOLARSHIP' && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-300">Are you officially released from your former club?</label>
                      <select name="releasedFromClub" value={releasedFromClub} onChange={(e) => setReleasedFromClub(e.target.value)} className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2">
                        <option value="on">Yes</option>
                        <option value="off">No</option>
                      </select>
                    </div>
                    {releasedFromClub === "on" && (
                      <div className="animate-[fadeIn_0.3s_ease-out] mt-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <label className="block text-sm font-medium text-white mb-2">Upload Club Release Letter (PDF, Max 5MB)</label>
                        <input name="clubReleaseLetter" type="file" accept=".pdf" required className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between mt-4">
                  <label className="text-gray-300">Do your parents/guardians consent to this?</label>
                  <select name="parentConsent" value={parentConsent} onChange={(e) => setParentConsent(e.target.value)} className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2">
                    <option value="on">Yes</option>
                    <option value="off">No</option>
                  </select>
                </div>
                {parentConsent === "on" && (
                  <div className="animate-[fadeIn_0.3s_ease-out] mt-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <label className="block text-sm font-medium text-white mb-2">Upload Parent Consent Letter (PDF, Max 5MB)</label>
                    <input name="consentLetter" type="file" accept=".pdf" required className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 mb-2 p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-emerald-400" strokeWidth={2} />
                  </div>
                  <label className="block text-sm font-medium text-white mb-1 text-center cursor-pointer">
                    Upload Passport Photograph
                    <input name="passportPhoto" type="file" accept="image/*" required className="block w-full text-sm text-gray-400 mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer" />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Required for your official ID card. Max 2MB.</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">First Name</label>
                  <input name="firstname" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                  <input name="lastname" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                  <input name="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors" />
                </div>
                <div className="md:col-span-2 relative">
                  <label className="block text-sm text-gray-400 mb-2">Dashboard Password (For future logins)</label>
                  <div className="relative">
                    <input name="password" type={showPassword ? "text" : "password"} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-white/30 focus:outline-none transition-colors" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Demographics */}
            <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${currentStep === 2 ? 'opacity-100 translate-y-0 block' : 'hidden opacity-0 translate-y-8'}`}>
              <h3 className="text-2xl font-medium mb-8 pb-4 border-b border-white/10">Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Age <span className="text-gray-500">{playerType === 'ACADEMIC' ? '(7 – 30)' : '(10 – 35)'}</span></label>
                  <input name="age" type="number" min={playerType === 'ACADEMIC' ? 7 : 10} max={playerType === 'ACADEMIC' ? 30 : 35} placeholder={playerType === 'ACADEMIC' ? '7 – 30' : '10 – 35'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gender</label>
                  {isMounted && <Select name="gender" options={genderOptions} styles={customSelectStyles} placeholder="Select..." />}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Country</label>
                  {isMounted && <Select options={countries} styles={customSelectStyles} defaultValue={countries.find(c => c.value === 'NG')} onChange={(v: any) => setSelectedCountryCode(v.value)} />}
                  <input type="hidden" name="nationality" value={countries.find(c => c.value === selectedCountryCode)?.label || ""} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">State/Province</label>
                  {isMounted && <Select name="state" options={states} styles={customSelectStyles} />}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Full Address</label>
                  <textarea name="address" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors resize-none" style={{ height: '72px' }} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">WhatsApp Number</label>
                  <div className="flex gap-3">
                    <div className="w-[160px] shrink-0">
                      {isMounted && <Select
                        options={dialCodeOptions}
                        styles={customSelectStyles}
                        defaultValue={dialCodeOptions.find(d => d.value === '+234')}
                        onChange={(v: any) => setSelectedDialCode(v)}
                        isSearchable
                        formatOptionLabel={formatDialCodeLabel}
                      />}
                    </div>
                    <input
                      type="text"
                      placeholder="8106131520"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none transition-colors"
                    />
                  </div>
                  <input type="hidden" name="mobile" value={`${selectedDialCode.value}${whatsappNumber}`} />
                </div>
              </div>
            </div>

            {/* STEP 3: Football Details */}
            <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${currentStep === 3 ? 'opacity-100 translate-y-0 block' : 'hidden opacity-0 translate-y-8'}`}>
              <h3 className="text-2xl font-medium mb-8 pb-4 border-b border-white/10">Football Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Preferred Position</label>
                  {isMounted && <Select name="position" options={positionOptions} styles={customSelectStyles} placeholder="Select..." />}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Strong Foot</label>
                  {isMounted && <Select name="foot" options={footOptions} styles={customSelectStyles} placeholder="Select..." />}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Height (e.g., 180cm)</label>
                  <input name="height" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Weight (e.g., 75kg)</label>
                  <input name="weight" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Previous Club (if any)</label>
                  <input name="prevclub" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Years of Experience</label>
                  <input name="experience" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
            </div>

            {/* STEP 4: Medical */}
            <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${currentStep === 4 ? 'opacity-100 translate-y-0 block' : 'hidden opacity-0 translate-y-8'}`}>
              <h3 className="text-2xl font-medium mb-8 pb-4 border-b border-white/10">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Blood Group</label>
                  {isMounted && <Select name="bloodgroup" options={bloodGroupOptions} styles={customSelectStyles} placeholder="Select..." />}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Genotype</label>
                  {isMounted && <Select name="genotype" options={genotypeOptions} styles={customSelectStyles} placeholder="Select..." />}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Emergency Contact Number</label>
                  <input name="emergencynumber" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
            </div>

            {/* STEP 5: Education & Guardian */}
            <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${currentStep === 5 ? 'opacity-100 translate-y-0 block' : 'hidden opacity-0 translate-y-8'}`}>
              <h3 className="text-2xl font-medium mb-8 pb-4 border-b border-white/10">Education & Guardian</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Institution/School</label>
                  <input name="institute" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Class/Level</label>
                  <input name="classlevel" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Guardian Name</label>
                  <input name="guardianname" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Relationship</label>
                  <input name="relationship" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Guardian Mobile</label>
                  <input name="guardianmobile" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">Guardian Address</label>
                  <input name="guardianaddress" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
            </div>

            {/* STEP 6: Agreement & Submit */}
            <div className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${currentStep === 6 ? 'opacity-100 translate-y-0 block' : 'hidden opacity-0 translate-y-8'}`}>
              <h3 className="text-2xl font-medium mb-8 pb-4 border-b border-white/10">Agreements & Payment</h3>
              <div className="space-y-6 mb-8">
                <label className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="checkbox" name="rules" required className="mt-1 w-5 h-5 accent-brand-gold rounded" />
                  <span className="text-gray-300 leading-relaxed text-sm">I agree to abide by the rules and regulations of Horizon United FC.</span>
                </label>
                <label className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="checkbox" name="discipline" required className="mt-1 w-5 h-5 accent-brand-gold rounded" />
                  <span className="text-gray-300 leading-relaxed text-sm">I understand that discipline, respect, and commitment are strictly expected.</span>
                </label>
              </div>
              
              <div className="bg-white/5 border border-brand-gold/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-[40px] rounded-full pointer-events-none"></div>
                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  Registration Payment
                </h4>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-lg">
                  Please transfer the exact amount to the account below and upload your payment receipt to complete your registration.
                </p>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bank</div>
                      <div className="font-semibold text-white">UBA</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</div>
                      <div className="font-mono font-bold text-brand-gold text-lg">&#8358;{registrationFee.toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Name</div>
                      <div className="font-semibold text-white">Horizon United FC LTD</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</div>
                      <div className="font-mono font-bold text-white text-xl tracking-wider">1030851781</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Upload Payment Receipt (Image/PDF)</label>
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      name="registrationReceipt" 
                      accept="image/*,.pdf" 
                      required 
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
                      onChange={(e) => setReceiptFileName(e.target.files?.[0]?.name || '')}
                    />
                    <div className="bg-black/20 border border-white/10 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 group-hover:border-brand-gold/50 transition-colors">
                      <Upload className="w-5 h-5 text-brand-gold" strokeWidth={2} />
                      <span className="text-sm text-gray-400 group-hover:text-gray-300">
                        {receiptFileName || "Choose file or drag & drop"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
              {error && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-red-400 bg-red-500/10 px-4 py-2 rounded-full text-sm">{error}</div>}
              
              <button 
                type="button" 
                onClick={handlePrev} 
                className={`px-6 py-3 rounded-full text-sm font-medium transition-opacity ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                Go Back
              </button>

              {currentStep < totalSteps ? (
                <button type="button" onClick={handleNext} className="group relative flex items-center gap-4 bg-brand-white text-brand-black px-8 py-3 rounded-full font-semibold overflow-hidden transition-transform active:scale-[0.98]">
                  <span className="relative z-10">{isCheckingEmail ? "Checking..." : "Next Step"}</span>
                  <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center relative z-10 group-hover:translate-x-1 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ) : (
                <button type="submit" disabled={isProcessing} className="group relative flex items-center gap-4 bg-brand-gold text-brand-black px-8 py-3 rounded-full font-semibold overflow-hidden transition-transform active:scale-[0.98]">
                  <span className="relative z-10">{isProcessing ? "Processing..." : `Submit Application`}</span>
                  <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center relative z-10 group-hover:translate-x-1 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
