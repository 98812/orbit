path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = ".nav-more-wrap {"
new = """.nav-more-btn {
  background: transparent;
  color: var(--cloud);
}

.nav-more-btn svg {
  width: 6px;
  height: 20px;
}

.nav-more-wrap {"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
