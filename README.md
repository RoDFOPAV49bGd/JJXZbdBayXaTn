# Question 2
For this lab, create 2 instances on AWS

We will choose **Amazon Linux 2** as our OS

Instance 1 will be our cronos node

Instance 2 will be our telemetry node

Install ansible and git on both instances
```sh
sudo amazon-linux-extras install ansible2 -y
sudo yum install git -y
```

Clone this repo on both instances
```sh
git clone https://github.com/RoDFOPAV49bGd/JJXZbdBayXaTn.git
cd JJXZbdBayXaTn/
```

On instance 1, run playbook cronos
```sh
ansible-playbook -idefault, -clocal playbook-cronos.yaml
```

Whitelist port `26660` (metrics) in security group of instance 1

On instance 2, run playbook telemetry
```sh
ansible-playbook -idefault, -clocal playbook-telemetry.yaml
```

Whitelist ports below in security group of instance 2
* 3000 - grafana
* 9090 - prometheus

The url of grafana will be http://[instance 2 ip]:3000

Then, login grafana with username `admin` and password `admin`

Add a prometheus datasource with url `http://localhost:9090`

Create a new dashboard with `dashboard.json` as json model
