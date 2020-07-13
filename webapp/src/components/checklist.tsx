// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react';
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
    DroppableProvided,
    DraggableProvided,
} from 'react-beautiful-dnd';

import {Checklist, ChecklistItem} from 'src/types/playbook';
import {MAX_NAME_LENGTH} from 'src/constants';

import {ChecklistItemDetails, ChecklistItemDetailsEdit} from './checklist_item';
import './checklist.scss';

interface Props {
    checklist: Checklist;
    onChange?: (itemNum: number, checked: boolean) => void;
    onRedirect?: (itemNum: number) => void;
    addItem: (checklistItem: ChecklistItem) => void;
    removeItem: (itemNum: number) => void;
    editItem: (itemNum: number, newItem: ChecklistItem) => void;
    reorderItems: (itemNum: number, newPosition: number) => void;
}

export const ChecklistDetails = ({checklist, onChange, onRedirect, addItem, removeItem, editItem, reorderItems}: Props): React.ReactElement => {
    const [newValue, setNewValue] = useState('');
    const [inputExpanded, setInputExpanded] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [checklistItems, setChecklistItems] = useState(checklist.items);

    const reorder = (list: ChecklistItem[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };

    useEffect(() => {
        setChecklistItems(checklist.items);
    }, [checklist.items]);

    const onEscapeKey = (e: {key: string}) => {
        if (e.key === 'Escape') {
            setNewValue('');
            setInputExpanded(false);
        }
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        setChecklistItems(reorder(checklistItems, result.source.index, result.destination.index));
        reorderItems(result.source.index, result.destination.index);
    };

    return (
        <div
            className='checklist-inner-container'
        >
            <div className='title'>
                {checklist.title}
                {' '}
                <a
                    className='checkbox-title__edit'
                    onClick={() => {
                        setEditMode(!editMode);
                    }}
                >
                    <span className='font-weight--normal'>{editMode ? '(done)' : '(edit)'}</span>
                </a>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable
                    droppableId='droppable'
                    renderClone={(provided, snapshot, rubric) => (
                        <div
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                        >
                            <ChecklistItemDetailsEdit
                                checklistItem={checklistItems[rubric.source.index]}
                                onEdit={(editedTo: ChecklistItem) => {
                                    editItem(rubric.source.index, editedTo);
                                }}
                                onRemove={() => {
                                    removeItem(rubric.source.index);
                                }}
                            />
                        </div>
                    )}
                >
                    {(droppableProvided: DroppableProvided) => (
                        <div
                            ref={droppableProvided.innerRef}
                            {...droppableProvided.droppableProps}
                            className='checklist'
                        >
                            {
                                !checklistItems.length && editMode &&
                                <div className='light mt-1 mb-2'>{'You don\'t have any checklist items to edit yet.'}</div>
                            }
                            {checklistItems.map((checklistItem: ChecklistItem, index: number) => {
                                if (editMode) {
                                    return (
                                        <Draggable
                                            index={index}
                                            key={checklistItem.title + index}
                                            draggableId={checklistItem.title + index}
                                        >
                                            {(draggableProvided: DraggableProvided) => {
                                                return (
                                                    <div
                                                        ref={draggableProvided.innerRef}
                                                        {...draggableProvided.draggableProps}
                                                        {...draggableProvided.dragHandleProps}
                                                        style={draggableProvided.draggableProps.style}
                                                        onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                                                            if (event.defaultPrevented) {
                                                                return;
                                                            }
                                                            event.currentTarget.focus();
                                                        }}
                                                    >
                                                        <ChecklistItemDetailsEdit
                                                            checklistItem={checklistItem}
                                                            onEdit={(editedTo: ChecklistItem) => {
                                                                editItem(index, editedTo);
                                                            }}
                                                            onRemove={() => {
                                                                removeItem(index);
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            }}
                                        </Draggable>
                                    );
                                }

                                return (
                                    <ChecklistItemDetails
                                        key={checklistItem.title + index}
                                        checklistItem={checklistItem}
                                        disabled={false}
                                        onChange={(checked: boolean) => {
                                            if (onChange) {
                                                onChange(index, checked);
                                            }
                                        }}
                                        onRedirect={() => {
                                            if (onRedirect) {
                                                onRedirect(index);
                                            }
                                        }}
                                    />
                                );
                            })}
                            {droppableProvided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            {inputExpanded &&
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (newValue.trim() === '') {
                            setInputExpanded(false);
                            return;
                        }
                        addItem({
                            title: newValue,
                            checked: false,
                            command: '',
                        });
                        setNewValue('');
                        setInputExpanded(false);
                    }}
                >
                    <input
                        autoFocus={true}
                        type='text'
                        value={newValue}
                        maxLength={MAX_NAME_LENGTH}
                        className='form-control mt-2'
                        placeholder={'Enter a new item'}
                        onKeyDown={(e) => onEscapeKey(e)}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                    <small className='light mt-1 d-block'>{'Press Enter to Add Item or Escape to Cancel'}</small>
                </form>
            }
            {!inputExpanded &&
                <div className='IncidentDetails__add-item'>
                    <a
                        href='#'
                        onClick={() => {
                            setInputExpanded(true);
                        }}
                    >
                        <i className='icon icon-plus'/>
                        {'Add new checklist item'}
                    </a>
                </div>
            }
        </div>
    );
};
