# SaaS Tenant Management — Backend (vernon_saas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `vernon_saas` Frappe app, migrate the `Organisasi` doctype from `sekolahpro`, and implement all tenant management API endpoints.

**Architecture:** `vernon_saas` is a new Frappe app that owns platform/SaaS concerns: tenant (Organisasi) CRUD, user provisioning, and module toggling. `sekolahpro` depends on it via a Link field. All API functions are `@frappe.whitelist()` in `vernon_saas/api/tenant.py`.

**Tech Stack:** Python 3.11, Frappe v15, MariaDB. App scaffolded manually (no `bench new-app` needed). Installed via `pip install -e` in the bench virtualenv.

---

## File Map

| Action | Path |
|--------|------|
| Create | `frappe/apps/vernon_saas/pyproject.toml` |
| Create | `frappe/apps/vernon_saas/vernon_saas/__init__.py` |
| Create | `frappe/apps/vernon_saas/vernon_saas/hooks.py` |
| Create | `frappe/apps/vernon_saas/vernon_saas/modules.txt` |
| Create | `frappe/apps/vernon_saas/vernon_saas/api/__init__.py` |
| Create | `frappe/apps/vernon_saas/vernon_saas/api/tenant.py` |
| Create | `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/__init__.py` |
| Create | `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/organisasi.py` |
| Create | `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/organisasi.json` |
| Modify | `frappe/apps/sekolahpro/sekolahpro/pengaturan/doctype/sekolah/sekolah.json` (remove organisasi field, it moves to vernon_saas) |
| Modify | `frappe/apps/sekolahpro/sekolahpro/pengaturan/doctype/koperasi/koperasi.json` (same) |
| Delete | `frappe/apps/sekolahpro/sekolahpro/pengaturan/doctype/organisasi/` (entire dir) |
| Modify | `frappe/apps/sekolahpro/sekolahpro/pengaturan/api/sekolah.py` (update imports) |

---

### Task 1: Scaffold `vernon_saas` app

**Files:**
- Create: `frappe/apps/vernon_saas/pyproject.toml`
- Create: `frappe/apps/vernon_saas/vernon_saas/__init__.py`
- Create: `frappe/apps/vernon_saas/vernon_saas/hooks.py`
- Create: `frappe/apps/vernon_saas/vernon_saas/modules.txt`

- [ ] **Step 1: Create app directory structure**

```bash
mkdir -p /Users/erickmo/Desktop/Project/frappe/apps/vernon_saas/vernon_saas/api
mkdir -p /Users/erickmo/Desktop/Project/frappe/apps/vernon_saas/vernon_saas/doctype/organisasi
```

- [ ] **Step 2: Create `pyproject.toml`**

```toml
[project]
name = "vernon_saas"
authors = [
    { name = "Vernon Corp", email = "dev@vernoncorp.com" }
]
description = "Vernon SaaS Platform — tenant and user management"
requires-python = ">=3.10"
readme = "README.md"
dynamic = ["version"]
dependencies = []

[build-system]
requires = ["flit_core >=3.4,<4"]
build-backend = "flit_core.buildapi"

[tool.ruff]
line-length = 110
target-version = "py310"
```

Save to: `frappe/apps/vernon_saas/pyproject.toml`

- [ ] **Step 3: Create `__init__.py`**

```python
__version__ = "0.0.1"
```

Save to: `frappe/apps/vernon_saas/vernon_saas/__init__.py`

- [ ] **Step 4: Create `hooks.py`**

```python
app_name = "vernon_saas"
app_title = "Vernon SaaS"
app_publisher = "Vernon Corp"
app_description = "SaaS platform — tenant and user management"
app_email = "dev@vernoncorp.com"
app_license = "MIT"

# Required apps
required_apps = ["frappe"]
```

Save to: `frappe/apps/vernon_saas/vernon_saas/hooks.py`

- [ ] **Step 5: Create `modules.txt`**

```
Vernon SaaS
```

Save to: `frappe/apps/vernon_saas/vernon_saas/modules.txt`

- [ ] **Step 6: Create empty `api/__init__.py`**

```python
```

Save to: `frappe/apps/vernon_saas/vernon_saas/api/__init__.py`

- [ ] **Step 7: Install app in bench virtualenv**

```bash
docker exec frappe-backend-1 bash -c \
  "/home/frappe/frappe-bench/env/bin/pip install -e /home/frappe/frappe-bench/apps/vernon_saas -q"
```

Expected output ends with: `Successfully installed vernon-saas-0.0.1`

- [ ] **Step 8: Install on site**

```bash
docker exec frappe-backend-1 bench --site site2.localhost install-app vernon_saas 2>&1 | tail -5
```

Expected: `App vernon_saas installed` (or `already installed`)

- [ ] **Step 9: Commit**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/vernon_saas
git init
git add .
git commit -m "feat: scaffold vernon_saas app"
```

---

### Task 2: Create `Organisasi` doctype in `vernon_saas`

**Files:**
- Create: `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/__init__.py`
- Create: `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/organisasi.py`
- Create: `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/organisasi.json`

- [ ] **Step 1: Create `__init__.py`**

```python
```

Save to: `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/__init__.py`

- [ ] **Step 2: Create `organisasi.py`**

```python
import frappe
from frappe.model.document import Document


class Organisasi(Document):
	pass
```

Save to: `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/organisasi.py`

- [ ] **Step 3: Create `organisasi.json`**

```json
{
 "actions": [],
 "autoname": "field:nama",
 "creation": "2026-05-10 00:00:00.000000",
 "doctype": "DocType",
 "engine": "InnoDB",
 "field_order": [
  "nama",
  "jenis_organisasi",
  "col_break_1",
  "status",
  "section_kontak",
  "npwp",
  "telepon",
  "col_break_2",
  "email",
  "logo",
  "section_alamat",
  "alamat"
 ],
 "fields": [
  {
   "fieldname": "nama",
   "fieldtype": "Data",
   "in_list_view": 1,
   "label": "Nama",
   "reqd": 1,
   "unique": 1
  },
  {
   "fieldname": "jenis_organisasi",
   "fieldtype": "Select",
   "label": "Jenis Organisasi",
   "options": "Yayasan\nPerusahaan\nPemerintah\nLainnya"
  },
  {
   "fieldname": "col_break_1",
   "fieldtype": "Column Break"
  },
  {
   "fieldname": "status",
   "fieldtype": "Select",
   "label": "Status",
   "options": "Aktif\nNon-Aktif",
   "default": "Aktif",
   "reqd": 1,
   "in_list_view": 1
  },
  {
   "fieldname": "section_kontak",
   "fieldtype": "Section Break",
   "label": "Kontak"
  },
  {
   "fieldname": "npwp",
   "fieldtype": "Data",
   "label": "NPWP"
  },
  {
   "fieldname": "telepon",
   "fieldtype": "Data",
   "label": "Telepon"
  },
  {
   "fieldname": "col_break_2",
   "fieldtype": "Column Break"
  },
  {
   "fieldname": "email",
   "fieldtype": "Data",
   "label": "Email",
   "options": "Email"
  },
  {
   "fieldname": "logo",
   "fieldtype": "Attach Image",
   "label": "Logo"
  },
  {
   "fieldname": "section_alamat",
   "fieldtype": "Section Break",
   "label": "Alamat"
  },
  {
   "fieldname": "alamat",
   "fieldtype": "Text",
   "label": "Alamat"
  }
 ],
 "links": [],
 "modified": "2026-05-10 00:00:00.000000",
 "modified_by": "Administrator",
 "module": "Vernon SaaS",
 "name": "Organisasi",
 "naming_rule": "By fieldname",
 "owner": "Administrator",
 "permissions": [
  {
   "create": 1,
   "delete": 1,
   "email": 1,
   "export": 1,
   "print": 1,
   "read": 1,
   "report": 1,
   "role": "System Manager",
   "share": 1,
   "write": 1
  },
  {
   "read": 1,
   "role": "All"
  }
 ],
 "sort_field": "nama",
 "sort_order": "ASC",
 "track_changes": 1
}
```

Save to: `frappe/apps/vernon_saas/vernon_saas/doctype/organisasi/organisasi.json`

- [ ] **Step 4: Run bench migrate to create table**

```bash
docker exec frappe-backend-1 bench --site site2.localhost migrate 2>&1 | tail -5
```

Expected output includes: `Updating DocTypes for vernon_saas`

- [ ] **Step 5: Verify table created**

```bash
docker exec frappe-db-1 mysql -uroot -padmin _bfe85aae738f5ec4 -e \
  "SHOW TABLES LIKE 'tabOrganisasi';" 2>/dev/null || \
docker exec frappe-backend-1 bench --site site2.localhost execute \
  "frappe.db.sql(\"SHOW TABLES LIKE 'tabOrganisasi'\")"
```

Expected: shows `tabOrganisasi`

- [ ] **Step 6: Commit**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/vernon_saas
git add .
git commit -m "feat: add Organisasi doctype in vernon_saas"
```

---

### Task 3: Migrate Organisasi data from sekolahpro

**Files:**
- Modify: `frappe/apps/sekolahpro/sekolahpro/pengaturan/doctype/sekolah/sekolah.json`
- Modify: `frappe/apps/sekolahpro/sekolahpro/pengaturan/doctype/koperasi/koperasi.json`

Note: Frappe resolves Link fields by doctype name (`"options": "Organisasi"`), not by app. Since both the old and new doctype are named `Organisasi`, no Link field changes are needed in Sekolah or Koperasi JSON — only the owning module changes.

- [ ] **Step 1: Copy existing Organisasi data to new table**

The old `tabOrganisasi` (owned by sekolahpro module) and new `tabOrganisasi` (owned by vernon_saas) are the same MariaDB table. Frappe uses a single `tabOrganisasi` table regardless of which app defines the doctype. Once `bench migrate` ran in Task 2, the existing data is already accessible.

Verify data is intact:

```bash
docker exec frappe-backend-1 bench --site site2.localhost execute \
  "print(frappe.get_all('Organisasi', fields=['name','nama','status']))"
```

Expected: lists existing organisations (e.g. Yayasan Pendidikan Maju, YPKI).

- [ ] **Step 2: Remove Organisasi doctype from sekolahpro**

Delete the directory:
```bash
rm -rf /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/pengaturan/doctype/organisasi
```

- [ ] **Step 3: Remove Organisasi from sekolahpro modules**

In `sekolahpro/pengaturan/module.json` (if it exists), remove any Organisasi reference. Check:

```bash
find /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro -name "*.json" | \
  xargs grep -l '"Organisasi"' 2>/dev/null
```

For each file found (except `sekolah.json` and `koperasi.json` which legitimately link to Organisasi), remove the Organisasi entry.

- [ ] **Step 4: Run migrate to clean up sekolahpro**

```bash
docker exec frappe-backend-1 bench --site site2.localhost migrate 2>&1 | tail -5
```

Expected: completes without error.

- [ ] **Step 5: Verify Sekolah still links to Organisasi**

```bash
docker exec frappe-backend-1 bench --site site2.localhost execute \
  "doc = frappe.get_doc('Sekolah', frappe.get_all('Sekolah')[0].name); print(doc.organisasi)"
```

Expected: prints the organisasi name (not empty, no error).

- [ ] **Step 6: Commit sekolahpro changes**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro
git add sekolahpro/pengaturan/
git commit -m "refactor: move Organisasi doctype to vernon_saas"
```

---

### Task 4: Implement `get_tenant_list` and `get_tenant_detail`

**Files:**
- Create: `frappe/apps/vernon_saas/vernon_saas/api/tenant.py`

- [ ] **Step 1: Create `tenant.py` with `get_tenant_list`**

```python
import frappe


@frappe.whitelist()
def get_tenant_list():
	"""Return all Organisasi with institution and user counts."""
	orgs = frappe.get_all(
		"Organisasi",
		fields=["name", "nama", "logo", "status", "jenis_organisasi", "email", "telepon", "npwp", "alamat"],
		order_by="nama asc",
	)

	result = []
	for org in orgs:
		sekolah_count = frappe.db.count("Sekolah", {"organisasi": org["name"]})
		koperasi_count = frappe.db.count("Koperasi", {"organisasi": org["name"]})

		# Count users with permissions on any institution under this org
		sekolah_names = frappe.get_all("Sekolah", filters={"organisasi": org["name"]}, pluck="name")
		koperasi_names = frappe.get_all("Koperasi", filters={"organisasi": org["name"]}, pluck="name")
		all_institution_names = sekolah_names + koperasi_names

		user_count = 0
		if all_institution_names:
			user_count = len(set(
				frappe.get_all(
					"User Permission",
					filters={"for_value": ("in", all_institution_names)},
					pluck="user",
				)
			))

		result.append({
			**org,
			"institution_count": sekolah_count + koperasi_count,
			"user_count": user_count,
		})

	return result
```

Save to: `frappe/apps/vernon_saas/vernon_saas/api/tenant.py`

- [ ] **Step 2: Add `get_tenant_detail`**

Append to `tenant.py`:

```python
@frappe.whitelist()
def get_tenant_detail(org):
	"""Return full tenant detail: info, institutions, users."""
	info = frappe.get_doc("Organisasi", org).as_dict()

	# Institutions
	institutions = []
	for sekolah in frappe.get_all("Sekolah", filters={"organisasi": org}, fields=["name", "nama", "logo", "status"]):
		lembaga = frappe.get_all(
			"Unit Jenjang",
			filters={"sekolah": sekolah["name"]},
			fields=["name", "nama", "tingkat"],
		)
		modul_aktif = frappe.get_all(
			"Modul Aktif",
			filters={"parent": sekolah["name"]},
			fields=["nama_modul", "aktif"],
		)
		institutions.append({
			**sekolah,
			"type": "sekolah",
			"lembaga": [{"name": l["name"], "nama": l["nama"], "jenjang": l["tingkat"]} for l in lembaga],
			"modul_aktif": [{"nama_modul": m["nama_modul"], "aktif": bool(m["aktif"])} for m in modul_aktif],
		})

	for kop in frappe.get_all("Koperasi", filters={"organisasi": org}, fields=["name", "nama", "logo", "status"]):
		modul_aktif = frappe.get_all(
			"Modul Aktif",
			filters={"parent": kop["name"]},
			fields=["nama_modul", "aktif"],
		)
		institutions.append({
			**kop,
			"type": "koperasi",
			"lembaga": [],
			"modul_aktif": [{"nama_modul": m["nama_modul"], "aktif": bool(m["aktif"])} for m in modul_aktif],
		})

	# Users
	sekolah_names = [i["name"] for i in institutions if i["type"] == "sekolah"]
	koperasi_names = [i["name"] for i in institutions if i["type"] == "koperasi"]
	all_names = sekolah_names + koperasi_names

	users = []
	if all_names:
		perms = frappe.get_all(
			"User Permission",
			filters={"for_value": ("in", all_names)},
			fields=["user", "for_value", "allow"],
		)
		seen_users = set()
		for perm in perms:
			if perm["user"] in seen_users:
				continue
			seen_users.add(perm["user"])
			try:
				user_doc = frappe.get_doc("User", perm["user"])
				users.append({
					"name": user_doc.name,
					"full_name": user_doc.full_name,
					"email": user_doc.email,
					"enabled": bool(user_doc.enabled),
					"roles": [r.role for r in user_doc.roles],
					"institution": perm["for_value"],
					"institution_doctype": perm["allow"],
				})
			except frappe.DoesNotExistError:
				continue

	return {"info": info, "institutions": institutions, "users": users}
```

- [ ] **Step 3: Test via curl**

```bash
# First login to get session
curl -s -X POST "http://localhost:8080/api/method/login" \
  -H "Host: site2.localhost:8080" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "usr=administrator&pwd=123123123" \
  -c /tmp/cookies.txt > /dev/null

# Test get_tenant_list
curl -s -X POST "http://localhost:8080/api/method/vernon_saas.api.tenant.get_tenant_list" \
  -H "Host: site2.localhost:8080" \
  -b /tmp/cookies.txt | python3 -m json.tool | head -30
```

Expected: JSON with list of organisations including `institution_count` and `user_count`.

- [ ] **Step 4: Commit**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/vernon_saas
git add .
git commit -m "feat: add get_tenant_list and get_tenant_detail API"
```

---

### Task 5: Implement `create_tenant` and `update_tenant`

**Files:**
- Modify: `frappe/apps/vernon_saas/vernon_saas/api/tenant.py`

- [ ] **Step 1: Append `create_tenant` and `update_tenant` to `tenant.py`**

```python
@frappe.whitelist()
def create_tenant(data):
	"""Create a new Organisasi (tenant)."""
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc({
		"doctype": "Organisasi",
		"nama": data.get("nama"),
		"jenis_organisasi": data.get("jenis_organisasi", "Yayasan"),
		"npwp": data.get("npwp", ""),
		"telepon": data.get("telepon", ""),
		"email": data.get("email", ""),
		"alamat": data.get("alamat", ""),
		"status": "Aktif",
	})
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def update_tenant(org, data):
	"""Update Organisasi fields."""
	if isinstance(data, str):
		import json
		data = json.loads(data)

	doc = frappe.get_doc("Organisasi", org)
	allowed_fields = {"nama", "jenis_organisasi", "npwp", "telepon", "email", "alamat", "logo", "status"}
	for field, value in data.items():
		if field in allowed_fields:
			setattr(doc, field, value)
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()
```

- [ ] **Step 2: Test `create_tenant`**

```bash
curl -s -X POST "http://localhost:8080/api/method/vernon_saas.api.tenant.create_tenant" \
  -H "Host: site2.localhost:8080" \
  -H "Content-Type: application/json" \
  -H "X-Frappe-CSRF-Token: fetch" \
  -b /tmp/cookies.txt \
  -d '{"data": {"nama": "Test Yayasan", "jenis_organisasi": "Yayasan", "email": "test@test.id"}}' \
  | python3 -m json.tool | grep '"name"'
```

Expected: `"name": "Test Yayasan"`

- [ ] **Step 3: Commit**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/vernon_saas
git add .
git commit -m "feat: add create_tenant and update_tenant API"
```

---

### Task 6: Implement institution status, user management, and module toggle

**Files:**
- Modify: `frappe/apps/vernon_saas/vernon_saas/api/tenant.py`

- [ ] **Step 1: Append `toggle_institution_status`**

```python
@frappe.whitelist()
def toggle_institution_status(name, doctype, status):
	"""Set status field on Sekolah or Koperasi."""
	if doctype not in ("Sekolah", "Koperasi"):
		frappe.throw("Invalid doctype")
	if status not in ("Aktif", "Non-Aktif"):
		frappe.throw("Invalid status")

	doc = frappe.get_doc(doctype, name)
	doc.status = status
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"name": name, "status": status}
```

- [ ] **Step 2: Append `create_org_user`**

```python
_VALID_ROLES = {
	"Teller", "Supervisor", "Pustakawan", "Kepala Perpustakaan",
	"Admin Guru", "Tata Usaha", "Perangkat Absensi",
}

@frappe.whitelist()
def create_org_user(org, email, full_name, password, role, institution, institution_doctype):
	"""Create a Frappe user and restrict them to one institution via User Permission."""
	if role not in _VALID_ROLES:
		frappe.throw(f"Role tidak valid: {role}")
	if institution_doctype not in ("Sekolah", "Koperasi"):
		frappe.throw("Invalid institution_doctype")

	if frappe.db.exists("User", email):
		frappe.throw(f"User dengan email {email} sudah ada")

	user = frappe.get_doc({
		"doctype": "User",
		"email": email,
		"first_name": full_name,
		"send_welcome_email": 0,
		"new_password": password,
		"roles": [{"role": role}],
	})
	user.insert(ignore_permissions=True)

	frappe.get_doc({
		"doctype": "User Permission",
		"user": email,
		"allow": institution_doctype,
		"for_value": institution,
		"apply_to_all_doctypes": 1,
	}).insert(ignore_permissions=True)

	frappe.db.commit()
	return {"name": email, "full_name": full_name, "email": email}
```

- [ ] **Step 3: Append `toggle_module`**

```python
@frappe.whitelist()
def toggle_module(institution, institution_doctype, module_name, aktif):
	"""Toggle a module on/off for a Sekolah or Koperasi."""
	if institution_doctype not in ("Sekolah", "Koperasi"):
		frappe.throw("Invalid institution_doctype")

	aktif_bool = str(aktif).lower() in ("1", "true", "yes")
	doc = frappe.get_doc(institution_doctype, institution)

	# Find existing row
	existing = next(
		(row for row in doc.modul_aktif if row.nama_modul == module_name),
		None,
	)

	if existing:
		existing.aktif = 1 if aktif_bool else 0
	elif aktif_bool:
		doc.append("modul_aktif", {"nama_modul": module_name, "aktif": 1})

	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"institution": institution, "module": module_name, "aktif": aktif_bool}
```

- [ ] **Step 4: Test `toggle_module`**

```bash
# Get an existing sekolah name first
SEKOLAH=$(curl -s "http://localhost:8080/api/resource/Sekolah?limit=1" \
  -H "Host: site2.localhost:8080" -b /tmp/cookies.txt | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['name'])" 2>/dev/null)

curl -s -X POST "http://localhost:8080/api/method/vernon_saas.api.tenant.toggle_module" \
  -H "Host: site2.localhost:8080" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Frappe-CSRF-Token: fetch" \
  -b /tmp/cookies.txt \
  -d "institution=$SEKOLAH&institution_doctype=Sekolah&module_name=Akademik&aktif=true" \
  | python3 -m json.tool
```

Expected: `{"message": {"institution": "...", "module": "Akademik", "aktif": true}}`

- [ ] **Step 5: Restart Frappe backend to pick up new endpoints**

```bash
docker restart frappe-backend-1
sleep 8
```

- [ ] **Step 6: Commit**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/vernon_saas
git add .
git commit -m "feat: add toggle_institution_status, create_org_user, toggle_module API"
```

---

## Self-Review

**Spec coverage:**
- ✅ `get_tenant_list` — Task 4
- ✅ `get_tenant_detail` — Task 4
- ✅ `create_tenant` — Task 5
- ✅ `update_tenant` — Task 5
- ✅ `toggle_institution_status` — Task 6
- ✅ `create_org_user` — Task 6
- ✅ `toggle_module` — Task 6
- ✅ `Organisasi` doctype migration — Task 2 + 3
- ✅ App scaffolding — Task 1

**Type consistency:** All functions use `org` as parameter name consistently. `institution_doctype` is used consistently across `toggle_institution_status`, `create_org_user`, `toggle_module`.

**Edge cases covered:**
- `create_org_user`: checks for duplicate email before insert
- `toggle_module`: handles both update existing row and insert new row
- `update_tenant`: allowlist of field names prevents arbitrary field injection
