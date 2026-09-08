path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """.nav-more-btn {
  background: rgba(245, 243, 255, 0.06);
  color: var(--cloud);
}

.nav-more-btn svg {
  width: 20px;
  height: 6px;
}"""

new = """.nav-more-btn {
  background: transparent;
  color: var(--cloud);
}

.nav-more-btn svg {
  width: 6px;
  height: 20px;
}"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
