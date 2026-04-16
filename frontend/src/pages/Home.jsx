import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import Footer from '../components/layout/Footer';

export default function Home() {
  const rawToken = localStorage.getItem('accessToken');
  const token = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;

  const features = [
    {
      icon: 'format_h1',
      title: 'Turn text into headings',
      body: 'Experience a rhythmic writing flow that adapts to your hierarchy effortlessly. Structural integrity meets aesthetic pleasure.'
    },
    {
      icon: 'content_paste',
      title: 'Paste long notes cleanly',
      body: 'Our advanced parser handles complex formatting with grace, ensuring your imported ideas look as good as they sound.'
    },
    {
      icon: 'public',
      title: 'Share publicly & safely',
      body: 'Granular permissions that feel simple. Distribute your work to the world with absolute control and encrypted security.'
    }
  ];

  return (
    <>
      {/* Top Navigation Shell */}
      <nav className="bg-[#131313]/70 backdrop-blur-3xl docked full-width top-0 sticky z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
          <div className="text-2xl font-serif italic text-[#f1c40f]">BlockNote</div>
          <div className="hidden md:flex items-center gap-10">
            <a className="text-[#e5e2e1]/80 hover:text-[#e5e2e1] text-xs font-bold uppercase tracking-widest Inter transition-colors duration-300" href="#">Product</a>
            <a className="text-[#e5e2e1]/80 hover:text-[#e5e2e1] text-xs font-bold uppercase tracking-widest Inter transition-colors duration-300" href="#">Support</a>
            <a className="text-[#e5e2e1]/80 hover:text-[#e5e2e1] text-xs font-bold uppercase tracking-widest Inter transition-colors duration-300" href="#">Legal</a>
          </div>
          <div className="nav-buttons">
            {token ? (
              <Link to="/dashboard" className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-full font-medium text-sm hover:scale-95 duration-200 ease-in-out transition-transform inner-shadow-button">Open Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Login</Link>
                <Link to="/register" className="btn-primary">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex flex-col items-center justify-center overflow-hidden grid-pattern">
          <div className="absolute inset-0 halo-glow pointer-events-none"></div>
          <div className="relative z-10 max-w-5xl px-8 text-center">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/30 pb-1">Precision Crafting</span>
            </div>
            <h1 className="text-6xl md:text-8xl serif-text tracking-tight text-on-surface mb-12 leading-[1.1]">
              Documents that feel <span className="italic text-primary">fluid</span> from the first keystroke.
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              {token ? (
                <Link to="/dashboard" className="bg-primary-container text-on-primary-container px-10 py-5 rounded-full text-lg font-semibold hover:scale-95 transition-transform inner-shadow-button flex items-center gap-2">
                  Go To Workspace
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              ) : (
                <Link to="/register" className="bg-primary-container text-on-primary-container px-10 py-5 rounded-full text-lg font-semibold hover:scale-95 transition-transform inner-shadow-button flex items-center gap-2">
                  Create Account
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              )}
              <Link to="/login" className="border border-outline-variant/30 text-on-surface px-10 py-5 rounded-full text-lg font-medium hover:bg-surface-container-low transition-colors">
                Login to Workspace
              </Link>
            </div>
          </div>
          <div className="mt-24 w-full max-w-6xl px-8">
            <div className="aspect-video rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/10 shadow-2xl relative">
              <img className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPh_twJyP0_9Mjh2FBYcLn9YsnymKVWBnmTZXGrtdZmR0MUh5pMMfTixp3tQ5ZGl9LN5WLsj1dATlVdZQY0Vvi9xL_K_x0kFbH298id_ixvCNnGdbZDDLKtbRDxJ_EXsiX2rGiBBVLELCu2ATzfCtVY7kGOR1NXIxcj1YkfzCXh03REObEhrvrUeF5InB5svMWqi-Iym8TXDBYsVaRgzDs8Utrn78PDYK3ljI-tSixm5xU9Nf5Xk3NFnWDewq6VlBP_H9y76OIT8s" alt="Premium close-up of a sleek digital interface showing clean text editor with gold accents on a dark metallic surface" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-surface-container-highest/80 backdrop-blur-md p-1 rounded-full border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-5xl">play_circle</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Feature Showcase */}
        <section className="py-32 bg-surface-container-low relative">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map(({ icon, title, body }) => (
                <div key={title} className="bg-surface-container-highest p-10 rounded-xl flex flex-col gap-6 group hover:translate-y-[-8px] transition-transform duration-500">
                  <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-container" style={{fontVariationSettings: "'FILL' 1"}}>{icon}</span>
                  </div>
                  <h3 className="text-3xl serif-text text-on-surface">{title}</h3>
                  <p className="text-on-surface-variant font-body leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Productivity Grid */}
        <section className="py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-20">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block Inter">Unified Ecosystem</span>
                <h2 className="text-5xl md:text-7xl serif-text tracking-tight text-on-surface">The heart of your digital workspace.</h2>
              </div>
              <p className="max-w-xs text-on-surface-variant font-body leading-relaxed italic mb-4">
                "Elegance is not being noticed, it's being remembered."
              </p>
            </div>
            <div className="grid grid-cols-12 gap-6 h-[600px]">
              {/* Main Module */}
              <div className="col-span-12 lg:col-span-7 bg-surface-container-low rounded-xl relative overflow-hidden border border-outline-variant/10 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-[#ff79c6]"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface">On-going Project</span>
                  </div>
                  <h4 className="text-4xl serif-text text-on-surface max-w-sm">Brand Identity Design Revamp 2024</h4>
                </div>
                <div className="flex items-end justify-between">
                  <img className="w-full h-48 object-cover rounded-lg border border-outline-variant/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8qmuik7hRwO5MN39yXxGh-p50jVlv2swSckf276rH5LMPbvX_qZZHdBhsmH5Lui4-c_NmLibafv9_82XmRlTPTO_mwptfJPqFVwzpkxnmPWd7il2tXxK-wOs1azEoVa0gyAuHiY6rGyZdN0oKLyeYdfCcMx4TdslGPwMgBJHSpP_10gLXiBZ5pfgEMJ9limiivma0EKV7eRDCok1sxksm9uD5lOhIQ9afzV5idTD3g3h0SMF52WvFddkTXDYMZH3p0mN1w6834zw" alt="Abstract minimalist design concept art with soft pink and charcoal geometric shapes in a gallery setting" />
                </div>
              </div>
              {/* Side Modules */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                <div className="h-1/2 bg-[#f1c40f]/10 rounded-xl border border-[#f1c40f]/20 p-8 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#f1c40f]/20 blur-3xl rounded-full"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#f1c40f]"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Daily Activity</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-5xl font-bold text-[#f1c40f] tracking-tighter">1,284</div>
                    <div className="text-sm text-on-surface-variant uppercase tracking-widest">Words Authored Today</div>
                  </div>
                </div>
                <div className="h-1/2 bg-[#8be9fd]/5 rounded-xl border border-[#8be9fd]/20 p-8 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#8be9fd]"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Live Conversation</span>
                  </div>
                  <div className="flex flex-col gap-3 mt-4">
                    <div className="flex items-center gap-3 p-2 bg-surface-container-highest rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-surface-variant"></div>
                      <div className="text-xs italic text-on-surface-variant">"The typography looks incredible on mobile..."</div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-surface-container-highest/40 rounded-lg translate-x-4">
                      <div className="w-8 h-8 rounded-full bg-surface-variant"></div>
                      <div className="text-xs italic text-on-surface-variant">"Agreed. Ready for public rollout?"</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Social Proof Banner */}
        <section className="py-16 bg-surface-container-lowest border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-wrap justify-between items-center gap-8 md:gap-4">
              <div className="flex flex-col items-center md:items-start">
                <span className="material-symbols-outlined text-primary mb-2">verified_user</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Secure and compliant</span>
              </div>
              <div className="w-px h-12 bg-outline-variant/20 hidden md:block"></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="material-symbols-outlined text-primary mb-2">groups</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">4 Million and counting</span>
              </div>
              <div className="w-px h-12 bg-outline-variant/20 hidden md:block"></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="material-symbols-outlined text-primary mb-2">military_tech</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Editor's Choice</span>
              </div>
              <div className="w-px h-12 bg-outline-variant/20 hidden md:block"></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="material-symbols-outlined text-primary mb-2">star</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">4.7 Stars</span>
              </div>
            </div>
          </div>
        </section>
        {/* Call to Action */}
        <section className="py-48 relative overflow-hidden text-center">
          <div className="absolute inset-0 halo-glow scale-150 opacity-40"></div>
          <div className="max-w-4xl mx-auto px-8 relative z-10">
            <h2 className="text-6xl md:text-8xl serif-text tracking-tight text-on-surface mb-16 leading-[1.05]">
              Let's Create an Amazing Project Together!
            </h2>
            <div className="flex justify-center">
              <Link to="/register" className="bg-primary-container text-on-primary-container px-20 py-10 rounded-full text-2xl font-bold uppercase tracking-[0.1em] hover:scale-105 transition-transform duration-500 shadow-2xl inner-shadow-button">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      {/* Footer Shell */}
      <footer className="bg-[#131313] w-full py-16">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="flex flex-col gap-6">
            <div className="text-xl font-serif italic text-[#f1c40f]">BlockNote</div>
            <p className="text-sm font-sans Inter text-[#e5e2e1]/60 leading-relaxed">
              Crafting the next generation of digital editorial experiences. Redefining how the world writes, edits, and publishes.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#e5e2e1]">Product</h5>
            <nav className="flex flex-col gap-3">
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Features</a>
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Pricing</a>
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Security</a>
            </nav>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#e5e2e1]">Support</h5>
            <nav className="flex flex-col gap-3">
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Help Center</a>
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Documentation</a>
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Contact Support</a>
            </nav>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#e5e2e1]">Legal</h5>
            <nav className="flex flex-col gap-3">
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Privacy Policy</a>
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Terms of Service</a>
              <a className="text-sm font-sans Inter text-[#e5e2e1]/60 hover:text-[#f1c40f] transition-all duration-300" href="#">Cookie Policy</a>
            </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-outline-variant/10 flex justify-between items-center text-xs font-sans Inter text-[#e5e2e1]/40">
          <p>© 2024 BlockNote Editorial. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="hover:text-[#f1c40f]" href="#">Twitter</a>
            <a className="hover:text-[#f1c40f]" href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </>
  );
}
