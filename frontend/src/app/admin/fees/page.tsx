"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Fee = {
  id: string;
  key: string;
  title: string;
  amount: number;
  category: string;
};

export default function AdminFees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("ACADEMIC");

  const router = useRouter();

  const fetchFees = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/fees");
      const data = await res.json();
      setFees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const openModal = (fee?: Fee) => {
    if (fee) {
      setEditingFee(fee);
      setTitle(fee.title);
      setAmount(fee.amount.toString());
      setCategory(fee.category);
    } else {
      setEditingFee(null);
      setTitle("");
      setAmount("");
      setCategory("ACADEMIC");
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFee(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const method = editingFee ? "PUT" : "POST";
    const url = editingFee ? `http://localhost:5000/api/fees/${editingFee.id}` : `http://localhost:5000/api/fees`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, amount, category })
      });
      if (res.ok) {
        await fetchFees();
        closeModal();
      } else {
        alert("Failed to save fee.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee?")) return;
    const token = localStorage.getItem("adminToken");
    
    try {
      const res = await fetch(`http://localhost:5000/api/fees/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchFees();
      } else {
        alert("Failed to delete fee.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-12 h-12 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
    </div>
  );

  const registrationFees = fees.filter(f => f.category === 'REGISTRATION');
  const academicFees = fees.filter(f => f.category === 'ACADEMIC');

  const renderFeeTable = (titleText: string, feeList: Fee[]) => (
    <div className="mb-12">
      <h2 className="text-2xl font-oswald font-bold uppercase tracking-widest text-brand-gold mb-6 border-b border-brand-white/10 pb-4">{titleText}</h2>
      
      <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-brand-white/5 border-b border-brand-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <div className="col-span-5">FEE DESCRIPTION</div>
          <div className="col-span-4 text-right">AMOUNT (NGN)</div>
          <div className="col-span-3 text-right">ACTIONS</div>
        </div>

        <div className="divide-y divide-brand-white/5">
          {feeList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">No fees found in this category.</div>
          ) : feeList.map((fee) => (
            <div key={fee.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-brand-white/5 transition-colors">
              <div className="col-span-5 font-medium text-white">{fee.title}</div>
              <div className="col-span-4 text-right font-mono text-gray-300 tracking-tight">₦{fee.amount.toLocaleString()}</div>
              <div className="col-span-3 flex justify-end gap-3">
                <button onClick={() => openModal(fee)} className="text-brand-gold hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Edit</button>
                <button onClick={() => handleDelete(fee.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm font-bold uppercase tracking-widest">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-oswald uppercase tracking-wide text-brand-white">
            Fees & <span className="text-brand-gold">Shop</span>
          </h1>
          <p className="text-gray-400 mt-2">Manage all registration and academic player fees.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="px-6 py-3 rounded-lg bg-brand-gold text-brand-black font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors shrink-0"
        >
          + Add New Fee
        </button>
      </header>

      {renderFeeTable("Registration Fees", registrationFees)}
      {renderFeeTable("Academic Player Fees", academicFees)}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-brand-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-[translateY_0.2s_ease-out]">
            <div className="px-6 py-5 border-b border-brand-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-oswald font-bold text-brand-gold uppercase tracking-widest">{editingFee ? "Edit Fee" : "Add New Fee"}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Fee Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold" placeholder="e.g., Medical Checkup" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Amount (NGN)</label>
                <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold" placeholder="e.g., 25000" />
              </div>
              {editingFee?.key === 'registration' ? null : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold appearance-none">
                    <option value="ACADEMIC" className="bg-[#111]">ACADEMIC</option>
                    <option value="REGISTRATION" className="bg-[#111]">REGISTRATION</option>
                  </select>
                </div>
              )}
              <div className="pt-4">
                <button type="submit" className="w-full px-6 py-3 rounded-lg bg-brand-gold text-brand-black font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors">
                  {editingFee ? "Update Fee" : "Save Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
