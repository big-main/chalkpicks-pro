import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

export default function AdminPromos() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 50,
    tier: "monthly" as "daily" | "monthly" | "yearly",
    maxUses: 100,
    source: "launch",
    expiresAt: "",
  });

  const { data: codes, refetch } = trpc.promoCode.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const createPromo = trpc.promoCode.create.useMutation({
    onSuccess: () => {
      toast.success("Promo code created!");
      refetch();
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: 50,
        tier: "monthly",
        maxUses: 100,
        source: "launch",
        expiresAt: "",
      });
      setShowForm(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create promo code");
    },
  });

  const deactivatePromo = trpc.promoCode.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Promo code deactivated");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to deactivate promo code");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-red mb-2">Access Denied</h1>
          <p className="text-gray-400">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPromo.mutate({
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      tier: formData.tier,
      maxUses: formData.maxUses || undefined,
      source: formData.source,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Promo Code Manager</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green/80 hover:bg-brand-green rounded font-medium transition"
          >
            <Plus className="w-4 h-4" /> New Code
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8 border border-brand-green/30">
            <h2 className="text-xl font-bold mb-4">Create Promo Code</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., LAUNCH50"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-brand-green"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-brand-green"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Discount Value</label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                  placeholder="50"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-brand-green"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-brand-green"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Uses</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., twitter, email, reddit"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="flex gap-2 col-span-1 md:col-span-2">
                <button
                  type="submit"
                  disabled={createPromo.isPending}
                  className="flex-1 px-4 py-2 bg-brand-green/80 hover:bg-brand-green disabled:bg-gray-600 rounded font-medium transition"
                >
                  {createPromo.isPending ? "Creating..." : "Create Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Codes table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700 border-b border-gray-600">
                <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Discount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tier</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Uses</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Revenue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes?.map((code) => (
                <tr key={code.id} className="border-b border-gray-700 hover:bg-gray-750 transition">
                  <td className="px-6 py-3 font-mono font-bold text-brand-green">{code.code}</td>
                  <td className="px-6 py-3">
                    {code.discountType === "percentage"
                      ? `${code.discountValue}%`
                      : `$${code.discountValue}`}
                  </td>
                  <td className="px-6 py-3 capitalize">{code.tier}</td>
                  <td className="px-6 py-3">
                    {code.currentUses} {code.maxUses ? `/ ${code.maxUses}` : ""}
                  </td>
                  <td className="px-6 py-3">
                    ${(code.stats?.totalRevenue || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        code.isActive
                          ? "bg-brand-green/10 text-brand-green"
                          : "bg-red-900/30 text-brand-red"
                      }`}
                    >
                      {code.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {code.isActive && (
                      <button
                        onClick={() => deactivatePromo.mutate({ codeId: code.id })}
                        disabled={deactivatePromo.isPending}
                        className="text-brand-red hover:text-red-300 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!codes || codes.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              No promo codes yet. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
