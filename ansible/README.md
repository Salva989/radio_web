# Ansible Deployment Starter

This playbook prepares a Docker host for the AzuraCast stack in this repo.

It intentionally stops before creating live DNS records, firewall policy, or
cloud infrastructure. Use it after you have a reachable Linux host.

## Files

- `inventory.example.yml` - copy to `inventory.yml` and set your host.
- `playbook.yml` - installs Docker, creates the app directory, renders `.env`,
  copies the compose file and config tree, then starts AzuraCast.

## Run

```bash
cp ansible/inventory.example.yml ansible/inventory.yml
ansible-galaxy collection install -r ansible/requirements.yml
ansible-playbook -i ansible/inventory.yml ansible/playbook.yml
```

Set production values in inventory variables or in an encrypted
`ansible-vault` vars file before running against a real host.
