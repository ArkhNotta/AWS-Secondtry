import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InventoryManagementStack } from '../lib/aw_ssecond-stack';

describe('Inventory Management Stack', () => {
  let app: cdk.App;
  let stack: InventoryManagementStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new InventoryManagementStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('DynamoDB Table is created with correct properties', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      AttributeDefinitions: [
        { AttributeName: 'productId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'productId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      StreamSpecification: {
        StreamViewType: 'NEW_IMAGE',
      },
    });
  });

  test('Lambda function for periodic insert is created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'periodicInsert.handler',
      Runtime: 'nodejs22.x',
      Environment: {
        Variables: {
          TABLE_NAME: { Ref: 'InventoryTableXXXXXX' },
        },
      },
    });
  });

  test('EventBridge Rule is configured for periodic inserts', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(5 minutes)',
      State: 'ENABLED',
    });
  });

  test('Lambda function for querying items is created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'queryAPI.handler',
      Runtime: 'nodejs22.x',
    });
  });

  test('API Gateway is connected to query Lambda function', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'QueryApi',
    });
  });

  test('SNS Topic is created for notifications', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('Lambda function for threshold monitoring is created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'thresholdMonitor.handler',
      Runtime: 'nodejs22.x',
    });
  });

  test('CloudWatch Alarm is configured for DynamoDB ItemCount', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'ItemCount',
      Threshold: 10,
    });
  });

  test('Lambda function for cleanup is created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'cleanup.handler',
      Runtime: 'nodejs22.x',
    });
  });
});
