import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MathToolShellComponent } from './math-tool-shell.component';

describe('MathToolShellComponent', () => {
  let component: MathToolShellComponent;
  let fixture: ComponentFixture<MathToolShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MathToolShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MathToolShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
