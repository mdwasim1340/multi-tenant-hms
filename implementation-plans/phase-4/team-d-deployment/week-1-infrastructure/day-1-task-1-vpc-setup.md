# Day 1, Task 1: VPC and Network Setup

## 🎯 Task Objective
Create a secure AWS VPC with public and private subnets, security groups, and network configuration for production deployment.

## ⏱️ Estimated Time: 2 hours

## 📋 Prerequisites
- AWS account with appropriate permissions
- AWS CLI installed and configured
- Terraform installed (optional, for infrastructure as code)

---

## 📝 Step 1: Create Infrastructure Directory

```bash
mkdir -p infrastructure/aws/vpc
cd infrastructure/aws/vpc
```

## 📝 Step 2: Create VPC Configuration (Terraform)

Create file: `infrastructure/aws/vpc/main.tf`

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-nat-eip-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.project_name}-nat-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt"
    Environment = var.environment
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.project_name}-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-alb-sg"
    Environment = var.environment
  }
}

# Security Group for Application Servers
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Frontend from ALB"
    from_port       = 3001
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from bastion (if needed)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-app-sg"
    Environment = var.environment
  }
}

# Security Group for Database
resource "aws_security_group" "database" {
  name        = "${var.project_name}-db-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from app servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-db-sg"
    Environment = var.environment
  }
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from app servers"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-redis-sg"
    Environment = var.environment
  }
}
```

## 📝 Step 3: Create Variables File

Create file: `infrastructure/aws/vpc/variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "hospital-management"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

## 📝 Step 4: Create Outputs File

Create file: `infrastructure/aws/vpc/outputs.tf`

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "App security group ID"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}
```

## 📝 Step 5: Create Terraform Backend Configuration

Create file: `infrastructure/aws/vpc/backend.tf`

```hcl
terraform {
  backend "s3" {
    bucket         = "hospital-management-terraform-state"
    key            = "vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

## 📝 Step 6: Create Deployment Script

Create file: `infrastructure/aws/scripts/deploy-vpc.sh`

```bash
#!/bin/bash

echo "🚀 Deploying VPC Infrastructure..."
echo "================================"

cd infrastructure/aws/vpc

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Validate configuration
echo "Validating configuration..."
terraform validate

if [ $? -ne 0 ]; then
  echo "❌ Terraform validation failed"
  exit 1
fi

# Plan deployment
echo "Planning deployment..."
terraform plan -out=tfplan

# Apply deployment
echo "Applying deployment..."
terraform apply tfplan

if [ $? -eq 0 ]; then
  echo "✅ VPC infrastructure deployed successfully"
  
  # Output important values
  echo ""
  echo "📊 Infrastructure Details:"
  terraform output
else
  echo "❌ Deployment failed"
  exit 1
fi

echo "================================"
```

Make it executable:

```bash
chmod +x infrastructure/aws/scripts/deploy-vpc.sh
```

## 📝 Step 7: Create Network Diagram Documentation

Create file: `infrastructure/aws/vpc/NETWORK_ARCHITECTURE.md`

```markdown
# Network Architecture

## VPC Configuration

**CIDR Block**: 10.0.0.0/16  
**Availability Zones**: 3 (us-east-1a, us-east-1b, us-east-1c)

## Subnet Layout

### Public Subnets (Internet-facing)
- **Public Subnet 1**: 10.0.0.0/24 (us-east-1a)
- **Public Subnet 2**: 10.0.1.0/24 (us-east-1b)
- **Public Subnet 3**: 10.0.2.0/24 (us-east-1c)

**Resources**: Application Load Balancer, NAT Gateways

### Private Subnets (Internal)
- **Private Subnet 1**: 10.0.3.0/24 (us-east-1a)
- **Private Subnet 2**: 10.0.4.0/24 (us-east-1b)
- **Private Subnet 3**: 10.0.5.0/24 (us-east-1c)

**Resources**: EC2 instances, RDS, ElastiCache

## Security Groups

### ALB Security Group
- **Inbound**: HTTP (80), HTTPS (443) from 0.0.0.0/0
- **Outbound**: All traffic

### Application Security Group
- **Inbound**: 3000-3002 from ALB, SSH from VPC
- **Outbound**: All traffic

### Database Security Group
- **Inbound**: PostgreSQL (5432) from App SG
- **Outbound**: All traffic

### Redis Security Group
- **Inbound**: Redis (6379) from App SG
- **Outbound**: All traffic

## Network Flow

```
Internet
   ↓
Internet Gateway
   ↓
Application Load Balancer (Public Subnets)
   ↓
EC2 Instances (Private Subnets)
   ↓
RDS / ElastiCache (Private Subnets)
```

## High Availability

- Multi-AZ deployment across 3 availability zones
- NAT Gateways in each AZ for redundancy
- Load balancer distributes traffic across AZs
- Database with Multi-AZ failover
- Redis with replication across AZs
```

## ✅ Verification

```bash
# Initialize and validate Terraform
cd infrastructure/aws/vpc
terraform init
terraform validate

# Expected output:
# Success! The configuration is valid.

# Plan deployment (dry run)
terraform plan

# Expected output:
# Plan: 25 to add, 0 to change, 0 to destroy.

# Apply deployment (if ready)
terraform apply

# Expected output:
# Apply complete! Resources: 25 added, 0 changed, 0 destroyed.
# Outputs:
# vpc_id = "vpc-xxxxx"
# public_subnet_ids = ["subnet-xxxxx", "subnet-yyyyy", "subnet-zzzzz"]
# ...

# Verify VPC creation
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=hospital-management-vpc"

# Verify subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"

# Verify security groups
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=<vpc-id>"
```

## 📄 Commit

```bash
git add infrastructure/
git commit -m "infra: Set up AWS VPC and network infrastructure

- Create VPC with public and private subnets
- Configure Internet Gateway and NAT Gateways
- Set up route tables for public and private subnets
- Create security groups for ALB, app, database, and Redis
- Add Terraform configuration for infrastructure as code
- Create deployment scripts
- Document network architecture"
```

## 🔗 Next Task
[Day 1, Task 2: EC2 Instance Setup](day-1-task-2-ec2-setup.md)

## 📚 Additional Resources
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
