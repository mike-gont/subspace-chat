import { TestBed } from '@angular/core/testing';

import { SubspaceComService } from './subspace-com.service';

describe('SubspaceComService', () => {
  let service: SubspaceComService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubspaceComService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
