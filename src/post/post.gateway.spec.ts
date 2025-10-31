import { Test, TestingModule } from '@nestjs/testing';
import { PostGateway } from './post.gateway';

describe('PostGateway', () => {
  let gateway: PostGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostGateway],
    }).compile();

    gateway = module.get<PostGateway>(PostGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
