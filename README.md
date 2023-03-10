```sh
# Install git
sudo yum install git -y
# Install ansible
sudo amazon-linux-extras install ansible2 -y
```

```sh
ansible-playbook -idefault, -clocal playbook.yaml
```
