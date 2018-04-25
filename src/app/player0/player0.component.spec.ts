import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Player0Component } from './player0.component';

describe('Player0Component', () => {
  let component: Player0Component;
  let fixture: ComponentFixture<Player0Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Player0Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Player0Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
