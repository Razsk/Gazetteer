import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditEntityModal } from './EditEntityModal';
import { useScenarioStore } from '@/store/scenarioStore';
import { Entity } from '@/domain/entities';

describe('EditEntityModal Trap Fields', () => {
  it('renders Detection Clue and Disarm as text input fields and saves updates', () => {
    const store = useScenarioStore.getState();
    const trapEntity: Entity = {
      id: 'trap-test-1',
      scenarioId: store.currentScenario?.id || 'scen-1',
      entityType: 'trap',
      name: 'Dart Trap',
      attributes: {
        trigger: 'Pressure plate in floor',
        detectionClue: 'Scratches on flagstones',
        disarm: 'Wedge iron wedge under plate',
        effect: '1d4 piercing + 1d6 poison',
        resetConditions: 'Manual reset',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useScenarioStore.setState({
      entities: {
        ...store.entities,
        [trapEntity.id]: trapEntity,
      },
    });

    const onClose = () => {};

    render(
      <EditEntityModal
        entityId={trapEntity.id}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Verify "Detection Clue" text input is rendered
    const detectionClueLabel = screen.getByText('Detection Clue');
    expect(detectionClueLabel).toBeInTheDocument();
    const detectionClueInput = screen.getByDisplayValue('Scratches on flagstones');
    expect(detectionClueInput).toBeInTheDocument();
    expect(detectionClueInput.tagName).toBe('INPUT');
    expect((detectionClueInput as HTMLInputElement).type).toBe('text');

    // Verify "Disarm" text input is rendered
    const disarmLabel = screen.getByText('Disarm');
    expect(disarmLabel).toBeInTheDocument();
    const disarmInput = screen.getByDisplayValue('Wedge iron wedge under plate');
    expect(disarmInput).toBeInTheDocument();
    expect(disarmInput.tagName).toBe('INPUT');
    expect((disarmInput as HTMLInputElement).type).toBe('text');

    // Modify the fields
    fireEvent.change(detectionClueInput, {
      target: { value: 'Slightly loose tile with fresh lime dust around the border' },
    });
    fireEvent.change(disarmInput, {
      target: { value: 'Carefully slide a thin blade into the gap to pin the spring mechanism' },
    });

    // Click Save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    const updatedEntity = useScenarioStore.getState().entities[trapEntity.id];
    expect(updatedEntity.attributes.detectionClue).toBe(
      'Slightly loose tile with fresh lime dust around the border'
    );
    expect(updatedEntity.attributes.disarm).toBe(
      'Carefully slide a thin blade into the gap to pin the spring mechanism'
    );
  });

  it('renders event list with version switcher and saves progress clock fields', () => {
    const store = useScenarioStore.getState();
    const eventEntity: Entity = {
      id: 'event-list-1',
      scenarioId: store.currentScenario?.id || 'scen-1',
      entityType: 'random_event_list',
      name: 'Catacomb Encounters',
      attributes: {
        eventListType: 'random_event',
        diceFormula: '1d6',
        frequencyTrigger: 'Every 2 hours',
        entries: [
          { roll: 1, title: 'Rats', description: 'Swarm of rats scurries past' },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useScenarioStore.setState({
      entities: {
        ...store.entities,
        [eventEntity.id]: eventEntity,
      },
    });

    render(
      <EditEntityModal
        entityId={eventEntity.id}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Verify version switcher buttons exist
    const randomEventBtn = screen.getByRole('button', { name: /random event table/i });
    const progressClockBtn = screen.getByRole('button', { name: /progress clock/i });
    expect(randomEventBtn).toBeInTheDocument();
    expect(progressClockBtn).toBeInTheDocument();

    // Verify Random Event fields initially visible
    expect(screen.getByDisplayValue('1d6')).toBeInTheDocument();

    // Switch to Progress Clock
    fireEvent.click(progressClockBtn);

    // Verify Progress Clock controls appear (e.g. 6 Slices preset button)
    const sixSlicesBtn = screen.getByRole('button', { name: /6 slices/i });
    expect(sixSlicesBtn).toBeInTheDocument();
    fireEvent.click(sixSlicesBtn);

    // Advance progress with + button
    const plusBtn = screen.getByRole('button', { name: '+' });
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);

    // Enter outcome consequence
    const outcomeInput = screen.getByPlaceholderText(/full alert: castle guards lock all gates/i);
    fireEvent.change(outcomeInput, {
      target: { value: 'Guards surround the party and seal doors.' },
    });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    const updated = useScenarioStore.getState().entities[eventEntity.id];
    expect(updated.attributes.eventListType).toBe('progress_clock');
    expect(updated.attributes.segments).toBe(6);
    expect(updated.attributes.currentProgress).toBe(2);
    expect(updated.attributes.outcome).toBe('Guards surround the party and seal doors.');
  });

  it('renders room/area contents editor, adds items, suggests to sensory box, and saves updates', () => {
    const store = useScenarioStore.getState();
    const areaEntity: Entity = {
      id: 'area-edit-1',
      scenarioId: store.currentScenario?.id || 'scen-1',
      entityType: 'area',
      name: 'Crypt of the Forgotten',
      attributes: {
        mapKey: '2C',
        dimensionsLighting: '30ft x 40ft, cold darkness',
        sensoryBox: 'A chill breeze stirs the damp cobwebs.',
        contents: ['Shattered sarcophagus with exposed bones'],
        exitsConnections: 'Archway to the north',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useScenarioStore.setState({
      entities: {
        ...store.entities,
        [areaEntity.id]: areaEntity,
      },
    });

    render(
      <EditEntityModal
        entityId={areaEntity.id}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Verify Map Key and Sensory Box suggestion note
    expect(screen.getByDisplayValue('2C')).toBeInTheDocument();
    expect(screen.getByText(/obvious contents can be mentioned here/i)).toBeInTheDocument();
    expect(screen.getByText(/Contents \/ Room Features/i)).toBeInTheDocument();

    // Verify existing content item is rendered
    expect(screen.getByDisplayValue('Shattered sarcophagus with exposed bones')).toBeInTheDocument();

    // Add a new content item
    const addItemBtn = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(addItemBtn);

    const emptyInputs = screen.getAllByPlaceholderText(/content item #/i);
    expect(emptyInputs.length).toBe(2);
    fireEvent.change(emptyInputs[1], {
      target: { value: 'Rusted bronze candelabra' },
    });

    // Click "Mention in Sensory Box"
    const mentionBtn = screen.getByRole('button', { name: /mention in sensory box/i });
    expect(mentionBtn).toBeInTheDocument();
    fireEvent.click(mentionBtn);

    // Verify sensoryBox now contains the mentioned contents
    const sensoryBoxTextarea = screen.getByPlaceholderText(/what players see, smell, hear as they enter/i) as HTMLTextAreaElement;
    expect(sensoryBoxTextarea.value).toContain('Shattered sarcophagus with exposed bones');
    expect(sensoryBoxTextarea.value).toContain('Rusted bronze candelabra');

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    const updated = useScenarioStore.getState().entities[areaEntity.id];
    expect(updated.attributes.contents).toEqual([
      'Shattered sarcophagus with exposed bones',
      'Rusted bronze candelabra',
    ]);
    expect(updated.attributes.sensoryBox).toContain('Visible within: Shattered sarcophagus with exposed bones, Rusted bronze candelabra.');
  });
});
