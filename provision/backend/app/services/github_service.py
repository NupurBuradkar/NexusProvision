"""
GitHub Automation Service.
Handles repository creation, adding collaborators, and configuring branch protection rules.
Seamlessly switches between live GitHub REST API and deterministic simulator based on token availability.
"""

import logging
from typing import Optional, Dict, Any
import httpx
from app.config import settings

logger = logging.getLogger("seqa.github")


class GitHubService:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = settings.GITHUB_TOKEN
        self.org = settings.GITHUB_ORG

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def provision_repository(
        self,
        repo_name: str,
        description: Optional[str] = None,
        visibility: str = "private",
        developer_github_username: Optional[str] = None,
        enable_branch_protection: bool = True,
    ) -> Dict[str, Any]:
        """
        Orchestrates repository creation, developer collaborator assignment,
        and branch protection rule configuration.
        """
        logger.info(f"Initiating repository provisioning: {repo_name} (org: {self.org})")

        # If live token is configured, make real GitHub API calls
        if self.token:
            return self._provision_live(
                repo_name=repo_name,
                description=description,
                visibility=visibility,
                developer_github_username=developer_github_username,
                enable_branch_protection=enable_branch_protection,
            )

        # Standalone simulated mode (when running locally or in demo environments)
        return self._provision_simulated(
            repo_name=repo_name,
            description=description,
            visibility=visibility,
            developer_github_username=developer_github_username,
            enable_branch_protection=enable_branch_protection,
        )

    def _provision_live(
        self,
        repo_name: str,
        description: Optional[str],
        visibility: str,
        developer_github_username: Optional[str],
        enable_branch_protection: bool,
    ) -> Dict[str, Any]:
        """Executes live GitHub API calls."""
        headers = self._get_headers()
        is_private = visibility in ["private", "internal"]
        
        with httpx.Client(timeout=15.0) as client:
            # 1. Create Repository
            create_payload = {
                "name": repo_name,
                "description": description or f"Provisioned by SEQA for onboarding",
                "private": is_private,
                "auto_init": True,
            }
            create_url = f"{self.base_url}/orgs/{self.org}/repos"
            res = client.post(create_url, json=create_payload, headers=headers)
            
            # If org endpoint fails (e.g. personal account token), fallback to /user/repos
            if res.status_code in [404, 403]:
                create_url = f"{self.base_url}/user/repos"
                res = client.post(create_url, json=create_payload, headers=headers)

            if res.status_code not in [200, 201]:
                raise RuntimeError(f"GitHub repo creation failed ({res.status_code}): {res.text}")

            repo_data = res.json()
            html_url = repo_data.get("html_url", f"https://github.com/{self.org}/{repo_name}")
            owner = repo_data.get("owner", {}).get("login", self.org)

            # 2. Add Developer as Collaborator (if username provided)
            collaborator_added = False
            if developer_github_username:
                collab_url = f"{self.base_url}/repos/{owner}/{repo_name}/collaborators/{developer_github_username}"
                collab_res = client.put(collab_url, json={"permission": "admin"}, headers=headers)
                collaborator_added = collab_res.status_code in [201, 204]

            # 3. Configure Branch Protection on main
            protection_applied = False
            if enable_branch_protection:
                protect_url = f"{self.base_url}/repos/{owner}/{repo_name}/branches/main/protection"
                protect_payload = {
                    "required_status_checks": None,
                    "enforce_admins": True,
                    "required_pull_request_reviews": {
                        "dismiss_stale_reviews": True,
                        "require_code_owner_reviews": True,
                        "required_approving_review_count": 1,
                    },
                    "restrictions": None,
                }
                prot_res = client.put(protect_url, json=protect_payload, headers=headers)
                protection_applied = prot_res.status_code in [200, 201]

            return {
                "success": True,
                "status": "ready",
                "github_url": html_url,
                "repo_name": repo_name,
                "owner": owner,
                "collaborator_added": collaborator_added,
                "branch_protection_enabled": protection_applied,
                "mode": "live_github_api",
            }

    def _provision_simulated(
        self,
        repo_name: str,
        description: Optional[str],
        visibility: str,
        developer_github_username: Optional[str],
        enable_branch_protection: bool,
    ) -> Dict[str, Any]:
        """Simulates GitHub repo provisioning with realistic metadata."""
        logger.info(f"[SIMULATION] Provisioned repository '{repo_name}' for '{developer_github_username or 'team'}'")
        return {
            "success": True,
            "status": "ready",
            "github_url": f"https://github.com/{self.org}/{repo_name}",
            "repo_name": repo_name,
            "owner": self.org,
            "collaborator_added": bool(developer_github_username),
            "branch_protection_enabled": enable_branch_protection,
            "mode": "deterministic_simulator",
            "description": description,
            "visibility": visibility,
        }


github_service = GitHubService()
