import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

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

    const asg = new autoscaling.AutoScalingGroup(this, "Asg", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: sg,
      maxCapacity: 10,
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
      port: 80,
      targets: [asg],
    });

    new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(alb, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
      },
    });

    new dynamodb.Table(this, "Table", {
      tableName: "urlshortener",
      partitionKey: { name: "shortid", type: dynamodb.AttributeType.STRING },
    });
  }
}
