path = "components/NavBar.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_state = "  const [me, setMe] = useState<{ avatar_url?: string; full_name?: string } | null>(null);"
new_state = old_state + "\n  const [menuOpen, setMenuOpen] = useState(false);"

old_right = """      <div className="nav-right">
        <LangToggle />
        {permission !== 'granted' && (
          <button
            onClick={enableBrowserNotifs}
            className="icon-btn"
            aria-label="Turn on alerts"
            title="Turn on alerts"
          >
            <span className="nav-icon">{ICONS.bell}</span>
          </button>
        )}
        <Link
          href="/admin"
          className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
          aria-label="Admin"
          title="Admin"
        >
          <span className="nav-icon">{ICONS.admin}</span>
          <span className="nav-text">{t('nav.admin')}</span>
        </Link>
      </div>"""

new_right = """      <div className="nav-right">
        {permission !== 'granted' && (
          <button
            onClick={enableBrowserNotifs}
            className="icon-btn"
            aria-label="Turn on alerts"
            title="Turn on alerts"
          >
            <span className="nav-icon">{ICONS.bell}</span>
          </button>
        )}
        <div className="nav-more-wrap">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="icon-btn nav-more-btn"
            aria-label="More options"
            title="More options"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="nav-dropdown">
              <div className="nav-dropdown-item">
                <LangToggle />
              </div>
              <Link
                href="/admin"
                className={`nav-link nav-dropdown-item ${isActive('/admin') ? 'active' : ''}`}
                aria-label="Admin"
                title="Admin"
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-icon">{ICONS.admin}</span>
                <span className="nav-text">{t('nav.admin')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>"""

missing = []
if old_state not in content:
    missing.append("state")
if old_right not in content:
    missing.append("nav_right")

if missing:
    print("NOT FOUND, missing:", missing, "- no changes made")
else:
    content = content.replace(old_state, new_state, 1)
    content = content.replace(old_right, new_right, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
