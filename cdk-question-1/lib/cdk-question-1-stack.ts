import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";

export class CdkQuestion1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQuestion1Queue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
      vpc,
      internetFacing: true,
    });

    const sg = new ec2.SecurityGroup(this, "Sg", { vpc });

    const policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            "dynamodb:List*",
            "dynamodb:DescribeReservedCapacity*",
            "dynamodb:DescribeLimits",
            "dynamodb:DescribeTimeToLive",
          ],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          actions: [
            "dynamodb:BatchGet*",
            "dynamodb:DescribeStream",
            "dynamodb:DescribeTable",
            "dynamodb:Get*",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:BatchWrite*",
            "dynamodb:CreateTable",
            "dynamodb:Delete*",
            "dynamodb:Update*",
            "dynamodb:PutItem",
          ],
          resources: ["arn:aws:dynamodb:*:*:table/urlshortener-jjxzbdbayxatn"],
        }),
      ],
    });

    const role = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      inlinePolicies: {
        policy,
      },
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "amazon-linux-extras install docker -y",
      "sudo systemctl enable --now docker",
      "docker pull whshk/jjxzbdbayxatn:v1",
      "docker run -p8000:8000 -d -e DOMAIN=https://d3jqzdh48hvxya.cloudfront.net whshk/jjxzbdbayxatn:v1"
    );

    const launchTemplate = new ec2.LaunchTemplate(this, "LaunchTemplate", {
      httpPutResponseHopLimit: 3,
      httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      role,
      userData,
      securityGroup: sg,
    });

    const asg = new autoscaling.AutoScalingGroup(this, "Asg", {
      vpc,
      maxCapacity: 10,
      minCapacity: 2,
      launchTemplate,
    });

    new autoscaling.TargetTrackingScalingPolicy(this, "ScalingPolicy", {
      autoScalingGroup: asg,
      targetValue: 80,
      predefinedMetric:
        autoscaling.PredefinedMetric.ASG_AVERAGE_CPU_UTILIZATION,
    });

    const listener = alb.addListener("Listener", {
      port: 80,
    });

    listener.addTargets("Targets", {
      port: 8000,
      targets: [asg],
    });

    const acl = new wafv2.CfnWebACL(this, "Acl", {
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "waf-cloudfront-jjxzbdbayxatn",
        sampledRequestsEnabled: true,
      },
      description: "WAF Cloudfront",
      name: "waf-cloudfront-jjxzbdbayxatn",
      rules: [
        {
          name: "RateLimit100-jjxzbdbayxatn",
          priority: 1,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 100,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "RateLimit100-jjxzbdbayxatn",
          },
        },
      ],
    });

    new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(alb, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      webAclId: acl.attrArn,
    });

    new dynamodb.Table(this, "Table", {
      tableName: "urlshortener-jjxzbdbayxatn",
      partitionKey: { name: "shortid", type: dynamodb.AttributeType.STRING },
    });
  }
}
