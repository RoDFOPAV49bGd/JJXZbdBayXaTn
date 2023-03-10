```sh
sudo amazon-linux-extras install ansible2 -y
sudo yum install git -y
```

```sh
git clone https://github.com/RoDFOPAV49bGd/JJXZbdBayXaTn.git
cd JJXZbdBayXaTn/
```

```sh
ansible-playbook -idefault, -clocal playbook-cronos.yaml
```

* 9090
* 3000
```sh
ansible-playbook -idefault, -clocal playbook-telemetry.yaml
```

Login grafana with username `admin` and password `admin`

Add a prometheus datasource with url `http://localhost:9090`

Create a new dashboard with `dashboard.json` as json model
