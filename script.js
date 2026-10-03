const STORAGE_KEY = "sai-resume-studio-v1";
const initialState = {
  fullName: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  linkedin: "",
  portfolio: "",
  skills: "",
  extras: "",
  experience: [],
  education: [],
  projects: [],
};

const repeaters = {
  experience: [
    { key: "role", label: "Role or position", placeholder: "Product Designer" },
    { key: "company", label: "Company", placeholder: "Studio or company" },
    { key: "dates", label: "Dates", placeholder: "2022 – Present" },
    { key: "location", label: "Location", placeholder: "City, Country" },
    { key: "description", label: "What you did and achieved", placeholder: "Share a result, contribution or responsibility.", type: "textarea", wide: true },
  ],
  education: [
    { key: "degree", label: "Degree or qualification", placeholder: "B.S. Computer Science" },
    { key: "school", label: "School", placeholder: "University or institution" },
    { key: "dates", label: "Year or dates", placeholder: "2020 – 2024" },
    { key: "detail", label: "Additional detail", placeholder: "Honors, focus area, GPA" },
  ],
  projects: [
    { key: "name", label: "Project name", placeholder: "Project or product" },
    { key: "link", label: "Project link", placeholder: "https://…" },
    { key: "description", label: "What makes it worth sharing?", placeholder: "Describe your contribution and its impact.", type: "textarea", wide: true },
  ],
};

const statusMessage = document.querySelector("#status-message");
const form = document.querySelector(".editor-column");
const preview = document.querySelector("#resume-preview");
let state = loadState();

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredClone(initialState);
    const parsed = JSON.parse(stored);
    const restored = { ...structuredClone(initialState) };
    for (const key of Object.keys(initialState)) {
      if (Array.isArray(initialState[key])) {
        if (Array.isArray(parsed[key])) restored[key] = parsed[key];
      } else if (typeof parsed[key] === "string") {
        restored[key] = parsed[key];
      }
    }
    return restored;
  } catch {
    showStatus("Your saved resume could not be read. You can still edit and print a new one.");
    return structuredClone(initialState);
  }
}

function showStatus(message) {
  statusMessage.textContent = message;
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showStatus("");
  } catch {
    showStatus("This browser couldn’t save your changes. Keep this page open before printing your resume.");
  }
}

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function addBlock(parent, title) {
  const section = element("section", "resume-block");
  section.append(element("h3", "", title));
  parent.append(section);
  return section;
}

function appendOptional(parent, tagName, className, value) {
  if (!value) return null;
  const node = element(tagName, className, value);
  parent.append(node);
  return node;
}

function safeUrl(value) {
  if (!value) return "";
  try {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(normalized);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function renderPreview() {
  preview.replaceChildren();
  const fullName = state.fullName.trim();
  preview.append(element("h2", "resume-name", fullName || "Your Name"));
  appendOptional(preview, "p", "resume-title", state.title.trim());

  const contact = element("div", "resume-contact");
  for (const value of [state.email, state.phone, state.location]) {
    appendOptional(contact, "span", "", value.trim());
  }
  for (const [label, value] of [["LinkedIn", state.linkedin], ["Portfolio", state.portfolio]]) {
    const url = safeUrl(value.trim());
    if (!url) continue;
    const link = element("a", "", label);
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    contact.append(link);
  }
  if (contact.childElementCount) preview.append(contact);

  const summary = state.summary.trim();
  if (summary) appendOptional(addBlock(preview, "Profile"), "p", "", summary);
  else {
    const block = addBlock(preview, "Profile");
    block.append(element("p", "preview-empty", "Your professional summary will appear here."));
  }

  const entries = [
    {
      key: "experience",
      heading: "Experience",
      primary: "role",
      secondary: ["company", "location"],
      date: "dates",
      description: "description",
    },
    {
      key: "education",
      heading: "Education",
      primary: "degree",
      secondary: ["school", "detail"],
      date: "dates",
    },
    {
      key: "projects",
      heading: "Projects",
      primary: "name",
      secondary: [],
      date: "",
      description: "description",
      link: "link",
    },
  ];

  for (const config of entries) {
    const values = state[config.key].filter((entry) =>
      Object.values(entry).some((value) => typeof value === "string" && value.trim()),
    );
    if (!values.length) continue;
    const section = addBlock(preview, config.heading);
    for (const entry of values) {
      const item = element("div", "resume-entry");
      const head = element("div", "resume-entry-head");
      appendOptional(head, "span", "", entry[config.primary]?.trim());
      appendOptional(head, "span", "", entry[config.date]?.trim());
      if (head.childElementCount) item.append(head);

      const secondary = config.secondary
        .map((key) => entry[key]?.trim())
        .filter(Boolean)
        .join(" · ");
      appendOptional(item, "p", "resume-entry-sub", secondary);

      const projectUrl = config.link ? safeUrl(entry[config.link]?.trim()) : "";
      if (projectUrl) {
        const link = element("a", "resume-entry-sub", entry[config.link].trim());
        link.href = projectUrl;
        link.target = "_blank";
        link.rel = "noreferrer";
        item.append(link);
      }
      appendOptional(item, "p", "resume-entry-description", entry[config.description]?.trim());
      section.append(item);
    }
  }

  const skills = state.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
  if (skills.length) {
    const section = addBlock(preview, "Skills");
    const list = element("div", "skill-list");
    for (const skill of skills) list.append(element("span", "skill-chip", skill));
    section.append(list);
  }

  const extras = state.extras.split("\n").map((item) => item.trim()).filter(Boolean);
  if (extras.length) {
    const section = addBlock(preview, "Additional");
    const list = element("p");
    list.textContent = extras.join(" · ");
    section.append(list);
  }
}

function renderRepeater(group) {
  const container = document.querySelector(`[data-repeater="${group}"]`);
  container.replaceChildren();
  state[group].forEach((entry, index) => {
    const card = element("div", "repeat-item");
    const fields = element("div", "repeat-fields");
    for (const field of repeaters[group]) {
      const label = element("label", field.wide ? "repeat-wide" : "", field.label);
      const control = element(field.type === "textarea" ? "textarea" : "input");
      control.dataset.group = group;
      control.dataset.index = String(index);
      control.dataset.key = field.key;
      control.placeholder = field.placeholder;
      if (field.type !== "textarea") control.type = "text";
      control.value = typeof entry[field.key] === "string" ? entry[field.key] : "";
      label.append(control);
      fields.append(label);
    }
    const remove = element("button", "remove-entry", "×");
    remove.type = "button";
    remove.dataset.remove = group;
    remove.dataset.index = String(index);
    remove.setAttribute("aria-label", `Remove ${group} entry ${index + 1}`);
    card.append(remove, fields);
    container.append(card);
  });
}

function renderAll() {
  for (const control of form.querySelectorAll("[name]")) {
    if (typeof state[control.name] === "string") control.value = state[control.name];
  }
  for (const group of Object.keys(repeaters)) renderRepeater(group);
  renderPreview();
}

form.addEventListener("input", (event) => {
  const control = event.target;
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
  const { group, index, key } = control.dataset;
  if (group && key && index !== undefined) {
    state[group][Number(index)][key] = control.value;
  } else if (control.name && typeof state[control.name] === "string") {
    state[control.name] = control.value;
  } else {
    return;
  }
  persistState();
  renderPreview();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const addButton = target.closest("[data-add]");
  if (addButton instanceof HTMLButtonElement) {
    const group = addButton.dataset.add;
    if (!group || !repeaters[group]) return;
    state[group].push({});
    renderRepeater(group);
    persistState();
    return;
  }
  const removeButton = target.closest("[data-remove]");
  if (removeButton instanceof HTMLButtonElement) {
    const group = removeButton.dataset.remove;
    const index = Number(removeButton.dataset.index);
    if (!group || !repeaters[group] || !Number.isInteger(index)) return;
    state[group].splice(index, 1);
    renderRepeater(group);
    renderPreview();
    persistState();
  }
});

document.querySelector("#clear-form").addEventListener("click", () => {
  if (!window.confirm("Clear all resume information saved in this browser?")) return;
  state = structuredClone(initialState);
  renderAll();
  persistState();
});

document.querySelector("#print-resume").addEventListener("click", () => window.print());
document.querySelector("#year").textContent = String(new Date().getFullYear());
renderAll();
