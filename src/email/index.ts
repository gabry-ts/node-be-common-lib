// export all types
export * from './types';

// export base class
export { EmailSender } from './EmailSender';

// export implementations
export { NodemailerSender } from './NodemailerSender';
export { AwsSender } from './AwsSender';

// export factory
export { EmailSenderFactory } from './EmailSenderFactory';
