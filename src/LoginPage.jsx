import { useState } from 'react';

/**
 * Generic Login Page for the Vibecoding Project Tracker prototype.
 *
 * Adheres to the dark, modern aesthetic defined in DESIGN.md:
 * - Surface page background (#0D0E11) with ambient brand glows
 * - Surface card (#16181D) with subtle border (#2A2E37)
 * - Brand primary (#6366F1) for logo badge, button fills, and focus rings
 * - Brand accent (#06B6D4) for links and highlights
 * - Inter font and responsive layout
 *
 * Prototype functionality:
 * - Entering any credentials (or leaving them blank) and clicking "Log In"
 *   (or pressing Enter) immediately logs the user into the project tracker homepage.
 * - Also provides 1-click quick demo buttons for convenience.
 */
export default function LoginPage({ onLogin, initialUsername = '' }) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [notice, setNotice] = useState('');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const resolvedUser = username.trim() || 'Demo User';
    onLogin({
      username: resolvedUser,
      email: username.includes('@')
        ? username.trim()
        : `${resolvedUser.toLowerCase().replace(/\s+/g, '.')}@vibecoding.dev`,
      rememberMe,
    });
  };

  const handleQuickDemo = (roleName) => {
    onLogin({
      username: roleName,
      email: `${roleName.toLowerCase().replace(/\s+/g, '.')}@vibecoding.dev`,
      rememberMe: true,
    });
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setNotice('Prototype Mode: No password recovery needed. Type anything (or nothing) and click Log In!');
    setTimeout(() => setNotice(''), 5000);
  };

  return (
    <div className="min-h-screen bg-surface-page text-text-primary font-body flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glows matching homepage vibe */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-brand-primary/10 rounded-full blur-[130px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-20 w-[450px] h-[450px] bg-brand-accent/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-primary/20 border border-brand-primary/40 text-brand-primary font-bold text-2xl shadow-lg shadow-brand-primary/10 mb-4">
            V
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary tracking-tight">
            Vibecoding Project Tracker<span className="text-brand-primary">.</span>
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Organised and clearheaded ready to take on your next task.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Prototype Guidance Callout */}
          <div className="mb-6 p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/25 flex items-start gap-2.5 text-xs text-text-muted">
            <svg
              className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold text-text-primary">Frontend Prototype: </span>
              Click <strong className="text-brand-primary">Log In</strong> with any input (or leave empty) to enter the tracker.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email field */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-medium text-text-muted mb-1.5"
              >
                Email or Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </span>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex@vibecoding.dev"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-surface-page border border-surface-border text-text-primary text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-text-muted"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-brand-accent hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-surface-page border border-surface-border text-text-primary text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Temporary inline notice (e.g. for forgot password hint) */}
            {notice && (
              <div className="p-2.5 rounded-lg bg-surface-page border border-brand-accent/40 text-brand-accent text-xs">
                {notice}
              </div>
            )}

            {/* Remember me option */}
            <div className="flex items-center justify-between text-xs text-text-muted pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-page border-surface-border text-brand-primary focus:ring-brand-primary focus:ring-offset-0 cursor-pointer accent-brand-primary"
                />
                <span>Remember me</span>
              </label>
              <span className="text-[11px] text-text-muted/60">Local session</span>
            </div>

            {/* Primary Log In Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-all duration-150 active:scale-95 shadow-sm shadow-brand-primary/25 mt-2"
            >
              <span>Log In</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-surface-card text-text-muted/60 uppercase tracking-wider text-[10px] font-mono">
                Or quick 1-click login
              </span>
            </div>
          </div>

          {/* Quick Demo Profile Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('Teammate A')}
              className="px-3 py-2 rounded-lg bg-surface-page hover:bg-surface-border/60 border border-surface-border text-xs text-text-primary transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-type-feature" />
              <span>Teammate A</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('Teammate B')}
              className="px-3 py-2 rounded-lg bg-surface-page hover:bg-surface-border/60 border border-surface-border text-xs text-text-primary transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-brand-accent" />
              <span>Teammate B</span>
            </button>
          </div>
        </div>

        {/* Feature Pills Footer */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-text-muted/60 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
            Kanban Board
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-type-feature" />
            Deliverable Anchors
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            AI Prompt Context
          </span>
        </div>
      </div>
    </div>
  );
}

