import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrackCard } from './TrackCard';
import type { ProjectTrack } from '../../types/project';

interface SortableTrackCardProps {
  track: ProjectTrack;
  projectColor: string;
  onToggleTask: (trackId: string, taskId: string) => void;
  onUpdateTrack: (trackId: string, data: Record<string, unknown>) => void;
}

export function SortableTrackCard(props: SortableTrackCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.track.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <TrackCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}
