# Dev Container Guide

This project includes a fully pre-configured Development Container (Dev Container) to ensure a consistent, reproducible development environment across all operating systems. It standardizes the Node.js runtime, toolchain, editor extensions, and port forwards.

---

## 1. Overview & Technical Specifications

The Dev Container configuration (`.devcontainer/devcontainer.json`) provisions an isolated Linux container tailored for full-stack monorepo development.

* **Base Image**: `mcr.microsoft.com/devcontainers/javascript-node:5-24-trixie` (Node.js v24 on Debian Trixie).
* **Pre-installed Extension**: [Biome (`biomejs.biome`)](https://biomejs.dev/) for fast linting, formatting, and import sorting.
* **Pre-configured Features**: `dot-config` (`ghcr.io/devcontainer-config/features/dot-config:4`) for dotfile management.
* **Automated Post-Create Command**: Executes `npm install` automatically after container creation.
* **Forwarded Ports**:
  * `5050` – **Backend API**
  * `5173` – **Frontend**
  * `5174` – **Dashboard**

---

## 2. Getting Started

### Prerequisites
* **Docker Desktop** (or OrbStack/Podman) installed and running on your host machine.
* **Visual Studio Code** installed.
* **Dev Containers Extension** (`ms-vscode-remote.remote-containers`) installed in VS Code.

---

### Option A: Local Development via VS Code

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd technique-monorepo
   ```

2. **Open in VS Code**:
   ```bash
   code .
   ```

3. **Reopen in Container**:
   * When prompted in the bottom-right corner with *"Reopen in Container"*, click **Reopen in Container**.
   * Alternatively, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS), type `Dev Containers: Reopen in Container`, and press `Enter`.

4. **Wait for Setup**:
   * VS Code will build the Docker container and automatically run `npm install` inside the container.
   * Once finished, the integrated terminal will open inside `/workspaces/nique.net` (or the root workspace folder).

---

### Option B: Cloud Development via GitHub Codespaces

1. Navigate to the main page of your repository on GitHub.
2. Click the green **Code** button and select the **Codespaces** tab.
3. Click **Create codespace on main**.
4. GitHub will initialize the environment using `.devcontainer/devcontainer.json`, complete with pre-configured extensions and forwarded ports.

---

## 3. Pre-configured Features & Tooling

### Post-Create Automation (`postCreateCommand`)
Upon container creation, the runtime automatically executes:
```json
"postCreateCommand": "npm install"
```
Because the repository uses npm workspaces, this installs dependencies across all workspaces (`root`, `backend`, `frontend`, and `dashboard`) in a single step.

### Editor Customizations & Extensions
The container automatically installs the **Biome** extension (`biomejs.biome`) inside VS Code, configuring code formatting and linting out of the box without requiring manual extension installation on your host system.

---

## 4. Architecture Integration & Development Workflow

The Dev Container is designed to manage all three services running concurrently.

### Initial Environment Setup

Inside the Dev Container terminal, copy the example environment file for the backend:

```bash
cp backend/.env.example backend/.env
```

Ensure the backend environment variables align with your local development setup (e.g., `PORT=5050`, `ATLAS_URI`, etc.).

### Starting the Applications

#### Running All Services Simultaneously (Root)
From the root workspace directory inside the container:
```bash
npm run dev
```

#### Running Services Individually
Open separate terminals inside VS Code (`Ctrl+Shift+\``) to run services independently:

* **Backend API**:
  ```bash
  cd backend && npm run dev
  # API accessible at http://localhost:5050
  ```

* **Public Frontend**:
  ```bash
  cd frontend && npm run dev
  # Site accessible at http://localhost:5173
  ```

* **Dashboard CMS**:
  ```bash
  cd dashboard && npm run dev
  # CMS accessible at http://localhost:5174
  ```

---

## 5. Troubleshooting & Maintenance

### Port Forwarding Issues
If a port is not accessible from your host browser:
1. Open the **Ports** tab in VS Code (`Ctrl+Shift+P` -> `Ports: Focus on Ports View`).
2. Verify ports `5050`, `5173`, and `5174` are listed.
3. If missing, manually add a port by clicking **Forward a Port** and typing `5050`, `5173`, or `5174`.

### Rebuilding the Dev Container
If you update `.devcontainer/devcontainer.json` or experience container environment state issues:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).
2. Run **`Dev Containers: Rebuild Container`** (or **`Dev Containers: Rebuild Without Cache`** for a full fresh start).

### Dependency & `node_modules` Resolution
If dependencies get out of sync across subfolders, run a clean re-installation from the workspace root:
```bash
# Clean root and package node_modules
rm -rf node_modules backend/node_modules frontend/node_modules dashboard/node_modules

# Re-install all workspace dependencies
npm install
```