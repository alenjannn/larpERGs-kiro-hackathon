import { StyleSheet, Text } from 'react-native';
import Button from './Button';
import Sheet, { SheetActions, sheetActionStyle } from './Sheet';
import { text } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Disables both buttons and shows a spinner on confirm. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation sheet. Dismissed by Cancel, the backdrop, Android back
 * and Escape on web (not while busy). Focus moves into the sheet when it opens.
 */
export default function ConfirmSheet({ visible, title, message, confirmLabel, cancelLabel = 'Cancel', destructive, busy, onConfirm, onCancel }: Props) {
  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <Sheet visible={visible} onClose={cancel} label={title}>
      <Text style={styles.message}>{message}</Text>
      <SheetActions>
        <Button title={cancelLabel} variant="secondary" onPress={cancel} disabled={busy} style={sheetActionStyle} />
        <Button title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} loading={busy} style={sheetActionStyle} />
      </SheetActions>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  message: text.body,
});
