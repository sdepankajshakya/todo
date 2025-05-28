import { TestBed } from '@angular/core/testing';

import { ColorUtilsService } from './color-utils.service';

describe('ColorUtilsService', () => {
  let service: ColorUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColorUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
