import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Table Enquiry');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSent(true);
    showToast('Your enquiry has been received. Our team will contact you promptly.', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Title */}
      <div className="space-y-3 max-w-xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
          Find &amp; Contact Us
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900">
          We Welcome Your Visit
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          Located in the heart of historical Winchester, we serve guests across dining rooms, snug bars, and private bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Contact Cards */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Location Card */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-amber-800 font-semibold text-sm">
              <MapPin className="w-5 h-5 text-amber-700" />
              <span>Restaurant Address</span>
            </div>
            <p className="text-sm text-stone-800 font-medium leading-relaxed">
              {settings?.address || '14 High Street, Winchester, Hampshire, SO23 9JX'}
            </p>
            <p className="text-xs text-stone-500">
              Convenient short-stay parking available at Colebrook Street car park.
            </p>
          </div>

          {/* Telephone & Email Card */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>Orders &amp; Kitchen Line</span>
              </div>
              <a
                href={`tel:${settings?.phone}`}
                className="text-base font-bold text-stone-900 hover:text-amber-800 transition-colors block"
              >
                {settings?.phone || '+44 1962 841234'}
              </a>
            </div>

            <div className="space-y-1 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>General &amp; Private Events</span>
              </div>
              <a
                href={`mailto:${settings?.email}`}
                className="text-sm font-semibold text-stone-900 hover:text-amber-800 transition-colors block"
              >
                {settings?.email || 'orders@heritagekitchen.co.uk'}
              </a>
            </div>
          </div>

          {/* Service Hours Card */}
          <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Service Schedule</span>
            </div>
            <div className="text-sm text-stone-300 whitespace-pre-line leading-relaxed font-mono">
              {settings?.opening_hours || 'Mon-Fri: 12:00 - 22:00\nSat-Sun: 11:30 - 22:30'}
            </div>
            <p className="text-xs text-stone-400">
              Orders for Home Delivery accepted until 21:30 daily.
            </p>
          </div>

        </div>

        {/* Right Column: Enquiry Form */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-stone-200 shadow-xs">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">Message Received</h3>
              <p className="text-sm text-stone-600 max-w-sm mx-auto">
                Thank you, {name}. A member of our host team will be in touch shortly regarding your enquiry.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setMessage('');
                }}
                className="px-4 py-2 bg-stone-100 text-stone-800 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Send a Message to Our Host Team
                </h3>
                <p className="text-xs text-stone-500">
                  For private parties, Sunday table bookings of 6+, or allergy questions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thomas Hardy"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. thomas@example.co.uk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Enquiry Subject
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                >
                  <option value="Table Booking">Table Booking (6+ Guests)</option>
                  <option value="Private Dining">Private Room / Event Hire</option>
                  <option value="Dietary">Dietary &amp; Allergen Queries</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please state preferred date, guest numbers, or dietary requirements..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Enquiry</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};
