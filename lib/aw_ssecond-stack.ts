import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as actions from 'aws-cdk-lib/aws-ses-actions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export class InventoryManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  
    const table = new dynamodb.Table(this, 'InventoryTable', {
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

  
    const periodicInsertLambda = new lambda.Function(this, 'InsertLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'Insert.handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantWriteData(periodicInsertLambda);

    new events.Rule(this, 'PeriodicInsertRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(periodicInsertLambda)],
    });

    const queryApiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'API.handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadData(queryApiLambda);

    
    const api = new apigateway.LambdaRestApi(this, 'QueryApi', {
      handler: queryApiLambda,
    });

    
    const monitorLambda = new lambda.Function(this, 'MonitorLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'monitor.handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadData(monitorLambda);

 
    const alarm = new cloudwatch.Alarm(this, 'ItemCountAlarm', {
      metric: table.metric('ItemCount'),
      threshold: 10,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
    });

    const snsTopic = new sns.Topic(this, 'NotificationTopic');
    alarm.addAlarmAction(new actions.SnsTopic(snsTopic));

  
    snsTopic.addSubscription(new subs.EmailSubscription('<your-email@example.com>'));

    
    const cleanupLambda = new lambda.Function(this, 'CleanupLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'cleanup.handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantWriteData(cleanupLambda);
    snsTopic.addSubscription(new subs.LambdaSubscription(cleanupLambda));
  }
}
