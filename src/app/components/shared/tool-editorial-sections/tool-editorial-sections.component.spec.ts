import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolEditorialSectionsComponent } from './tool-editorial-sections.component';

describe('ToolEditorialSectionsComponent', () => {
  let component: ToolEditorialSectionsComponent;
  let fixture: ComponentFixture<ToolEditorialSectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolEditorialSectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolEditorialSectionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('model', { title: 'Guide', sections: [] });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
