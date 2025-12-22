import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TcDropdownComponent } from './tc-dropdown.component';

describe('TcDropdownComponent', () => {
  let component: TcDropdownComponent;
  let fixture: ComponentFixture<TcDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TcDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TcDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
