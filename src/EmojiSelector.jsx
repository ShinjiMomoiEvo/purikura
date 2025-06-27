import { Picker } from 'emoji-mart';
import data from '@emoji-mart/data';

export default function EmojiSelector({ onSelect }) {
    return (
        <Picker
            data={data}
            onEmojiSelect={emoji => onSelect(emoji.native)}
        />
    );
}
