# Nexify DevOps — Enterprise Fleet Control Plane

**Nexify DevOps** is the dedicated, internal developer and operations management platform by **Nexify Forge Technologies**.

It provides centralized monitoring, multi-client workspace switching, telemetry collection, mobile app version gatekeeping, and 1-click database operations while keeping all client projects (OrderKare, Custom CRMs, Logistics Apps) strictly isolated.

---

### Quick Start (Local Development)

```bash
# 1. Navigate to the platform directory
cd nexify-devops

# 2. Install dependencies
npm install

# 3. Start the development server (runs on port 5174)
npm run dev
```

Visit: **`http://localhost:5174`**

---

### Default Developer Credentials
* **Developer Identity**: `dev@nexifyforge.com`
* **Access Key**: `nexify_master_devops_2026`
* **2FA Security PIN**: `7562`

---

### Architecture & Isolation Model
1. **Client Projects (`../backend`, `../frontend`, `../admin-android`)**: Client-facing apps remain completely isolated with zero internal devops routes.
2. **Nexify DevOps (`nexify-devops/`)**: Standalone control plane monitoring all client fleets from a single unified hub.
3. **Nexify Forge**: Company umbrella managing infrastructure, deployments, and security compliance.
