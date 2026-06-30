import { useState } from "react";
import { MdHelpOutline, MdClose, MdSend, MdCheckCircle } from "react-icons/md";
import api from "../../services/api";

const HelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim() || form.message.trim().length < 5) {
      setError("Please enter a message (at least 5 characters)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/feedback", form);
      setSuccess(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to send. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Help Button — fixed bottom-right corner, above content */}
      <button
        onClick={() => {
          setIsOpen(true);
          setSuccess(false);
          setError("");
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium"
        title="Help & Feedback"
      >
        <MdHelpOutline size={18} />
        <span>Help</span>
      </button>

      {/* Modal — anchored to bottom-right corner, opens upward */}
      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
          <div
            className="absolute bottom-24 right-6 w-[calc(100%-3rem)] sm:w-96 max-h-[75vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-primary-600 rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <MdHelpOutline size={20} className="text-white" />
                <h3 className="text-base font-semibold text-white">
                  Help & Feedback
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {success ? (
                <div className="flex flex-col items-center text-center py-6">
                  <MdCheckCircle size={48} className="text-green-500 mb-3" />
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Message Sent!
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Thank you for your feedback. We'll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Have a question, found a bug, or want to suggest an
                    improvement? We'd love to hear from you!
                  </p>

                  {error && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-600 dark:text-red-400 text-xs">
                        {error}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="label">
                      Your Name{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="John Doe"
                      className="input text-sm"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="label">
                      Email Address{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="you@example.com"
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="label">How can we help you?</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, message: e.target.value }));
                        setError("");
                      }}
                      placeholder="Describe your issue or suggestion..."
                      rows={4}
                      className="input text-sm resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {form.message.length}/500
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <MdSend size={16} /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;
