import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextCaseToolComponent } from './text-case-tool.component';

describe('TextCaseToolComponent', () => {
  let component: TextCaseToolComponent;
  let fixture: ComponentFixture<TextCaseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextCaseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextCaseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
