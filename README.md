# Question 1
![](question1-arch.png)
In this lab, we will run our Rust application on Amazon Linux 2 (AL2) with docker

Table below shows our tech stack
|Name|Choice|Summary|
|---|---|---|
|Cache|Cloudfront|Managed, global|
|Load balancer|ALB|Managed, regional|
|Technology|Docker||
|Programming language|Rust||
|Database|Dynamodb||

We choose Cloudfront as our cache, Cloudfront is managed and it is a global resource

We choose Application Load Balancer (ALB) as our load balancer, ALB is managed, it is a regional resource and it can be placed in subnets (us-east-1a and us-east-1b here) within a VPC

Dynamodb as our database, dynamodb is a regional or global resource, we choose regional, so it is HA

# Question 2
In this lab, create 2 instances on AWS

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
ansible-playbook -idefault, -clocal playbook-cronos.yaml -e moniker=my-awesome-node
```

Whitelist port `26660` (metrics) in security group of instance 1

On instance 2, run playbook telemetry
```sh
ansible-playbook -idefault, -clocal playbook-telemetry.yaml -e cronos_node_ip=[instance 1 ip]
```

Whitelist ports below in security group of instance 2
* 3000 - grafana
* 9090 - prometheus

The url of grafana will be http://[instance 2 ip]:3000

The url of prometheus will be http://[instance 2 ip]:9090

Login grafana with username `admin` and password `admin`

Add a prometheus datasource with url `http://localhost:9090`

Create a new dashboard with [`dashboard.json`](https://github.com/RoDFOPAV49bGd/JJXZbdBayXaTn/raw/master/dashboard.json) as json model
## Deliverables
* Ansible playbook for cronos node - [`playbook-cronos.yaml`](https://github.com/RoDFOPAV49bGd/JJXZbdBayXaTn/raw/master/playbook-cronos.yaml)
* Ansible playbook for telemetry node - [`playbook-telemetry.yaml`](https://github.com/RoDFOPAV49bGd/JJXZbdBayXaTn/raw/master/playbook-telemetry.yaml)
* Grafana dashboard json - [`dashboard.json`](https://github.com/RoDFOPAV49bGd/JJXZbdBayXaTn/raw/master/dashboard.json)
## Assumptions and limitations
* The telemetry playbook only works on AL2
## Problems
* The cronos node metrics only contains `tendermint_mempool_size`, but not `tendermint_consensus_block_size_bytes`, `tendermint_consensus_num_txs` nor `tendermint_consensus_rounds`
