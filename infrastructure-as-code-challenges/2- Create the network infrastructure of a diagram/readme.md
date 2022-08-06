

<div align="center">
  <h1 align="center">Infrastructure as Code Challenge 2</h1>
  <h3 align="center">
    In this challenge you are required to <br> create the network infrastructure of a given diagram 
    <br />
    <br/>
  </h3>
</div>

<!-- TABLE OF CONTENTS -->
  <strong>Table of Contents</strong>
  <ol>
    <li>
      <a href="#about-the-challenge">About The Challenge
      </a>
      <ul>
        <li>
        <a href="#diagram-resources">Diagram Resources
        </a>
        </li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#cli-commands">CLI Commands</a></li>
        <li><a href="#used-parameters">Used Parameters</a></li>  
      </ul>
    </li>
    <li> <a href="#creating-the-stack">Creating the Stack</a></li>
      <li> <a href="#output">Output</a></li>

  </ol>


## About The Challenge

> You have been tasked with creating the required Infrastructure-as-code scripts for a new cloud environment in AWS. The Lead Solutions Architect for the project sends you the following diagram <br><br>
![diagram](./Diagram.png)



Now Let't break this diagram into smaller parts
### Diagram Resources:
1. Main VPC with the CIDR range 10.0.0.0/16
2. An internet gateway attached to the VPC
3. Two Subnets one public and the other is private
4. Two Route Tables associated to each subnet
5. A NAT gateway for the private subnet to provide outboud internet access 
6. Elastic IP for the NAT gateway
###
    AWS::EC2::VPC
    AWS::EC2::InternetGateway
    AWS::EC2::VPCGatewayAttachment
    AWS::EC2::Subnet
    AWS::EC2::NatGateway
    AWS::EC2::EIP
    AWS::EC2::RouteTable
    AWS::EC2::Route
    AWS::EC2::SubnetRouteTableAssociation

<!-- GETTING STARTED -->
## Getting Started

Before we write the script let's know how to validate the written script and how to update an existing stack as we will build it step by step. 

### CLI Commands

* To validate the syntax `typo` of template we'll use the following script and it will prompt any error
    ```bash
    aws cloudformation validate-stack --stack-name your-stack
    ```
* We will create the stack in many steps so we'll create the stack only in the first run, then will update it instead of deleting and recreating it.
    ```bash
    aws cloudformation update-stack --stack-name your-stack --template-body file://path --parameters file://path --region=region
    ```
 
### Used Parameters
> - `EnvironmentName` - An environment name to be prefix to the resources
> - `VpcCIDR` - The VPC CIDR Block - IP Range 
> - `PublicSubnetCidr` - The public Subnet CIDR Block
> - `PrivateSubnetCidr` - The Private Subnet CIDR Block 

## Creating the Stack

1. The First Resource we have is the `VPC` found [here](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpc.html)
    ```yaml
    MyVPC:
      Type: AWS::EC2::VPC
      Properties:
        CidrBlock: !Ref VpcCIDR
        EnableDnsHostnames: True
        Tags:
          - Key: Name
            Value: !Ref EnvironmentName
    ```
  
    - Note that the <strong> _`!Ref: EnvironmentName`_ </strong> is a parameter reference for the Environment Name in the parameters 
<hr>

2. Then let's create the `InternetGateway` for world's inboud and outboud traffic to our VPC
    ```yaml
    InternetGateway:
      Type: AWS::EC2::InternetGateway
      Properties:
        Tags:
          - Key: Name
            Value: !Ref EnvironmentName
    ```

  - Creating the internet gateway only isn't enough; we should attach it to the VPC.
  So we will create a resource called `VPCGatewayAttachment`
    ```yaml
    # Attaching the Gateway to the VPC
    InternetGatewayAttachment:
      Type: AWS::EC2::VPCGatewayAttachment
      Properties:
        InternetGatewayId: !Ref InternetGateway
        VpcId: !Ref MyVPC
    ``` 
<hr>

3. The next step is creating the public and the private subnets. the only thing that distingush the private form the public is the property `MapPublicIpOnLaunch:`  `True` if the subnet is public to associate public IP to the resources in it.
    ```yaml
    PublicSubnet:
      Type: AWS::EC2::Subnet
      Properties:
        VpcId: !Ref MyVPC
        AvailabilityZone: AZ
        CidrBlock: !Ref CIDR Block Range
        MapPublicIpOnLaunch: true/false
        Tags:
          - Key: Name
            Value: !Sub ${EnvironmentName}-subnet
    ```
    - The `!Sub:` is an AWS intrinsic function to substitute the envName parameter.
<hr>

* **You may ask yourself, what if that resources in the private subnet need to download or update packages?**
  The resources in the vpc can talk to each other using the private IP even if they are in different subnets; so we need a resource in our vpc to act as a resource in the middle as we want to prevent direct access to our resources.

  <br>
  
  The resource we need is called `NAT Gateway`.
  Network Address Translation (NAT) is a service you can use so that instances in a private subnet can connect to services outside your VPC but external services cannot initiate a connection with those instances.
  - Note that the NAT Gateway connectivity type here is set to Public to communicate with external IPs so it must be placed in a public subnet to be accessible
- `Elastic IP address (EIP)` is the resource we need with the NAT Gateway to allocate a static address. This resource is a must as we can't work with dynamic IP allocation that causes changing the IPs if a restart happened or something like that. If the address changed, that would be guaranteed to break any sessions in progress.   
  ```yaml
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      SubnetId: !Ref PublicSubnet # Subnet containing the NAT Gateway 
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
  ``` 
    - `DependsOn:` tells the cloudformation to wait for the InternetGatewayAttachment to be ready to be able to access the Internet.
    - `!GetAtt` is an AWS intrinsic function to get an attribute from a resource as we need to assign to the reserved public IP address.
    
<hr>

* The remaining part is to associate two `route tables` the public and the private subnet in order to manage the communication within the VPC.
The route table contains a set of rules called routes, that determine where network traffic from your subnet or gateway is directed.
<br>

* The Process of creating route table is consisted of 3 main steps:
  1. Creating the RouteTable
  2. Add the table entries (routes) to the table
      * For the public subnet: redirect traffic from anywhere to the internet gateway
      * For the private subnet: redirect traffic to the NAT gateway
  3. associate the table to the subnet

  ```yaml
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC
  # Public Route Table Rules
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
  # Associating the routing table to the public subnet
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet
  ```
  - For the private subnet we won't specify the internet gateway but we'll assign the NAT gateway 
    ```yaml
    DestinationCidrBlock: 0.0.0.0/0
    NatGatewayId: !Ref NatGateway
    ```   
 

## Output
> Let's export some important Ids to the stack output to use them in another stack template.

  ```yaml
  # output section
  LogicalName:
    Description: String
    Value: !Ref Resource/Parameter Logical Name
    Export:
      Name: String # The name of the output variable
  ```

  


