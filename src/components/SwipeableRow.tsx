import * as Haptics from "expo-haptics";
import { PencilSimple, Trash } from "phosphor-react-native";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { fonts, makeStyles, useTheme } from "@/src/theme";

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
  // Pergunta mostrada antes de apagar.
  deleteMessage?: string;
  children: React.ReactNode;
};

// Linha igual à do Controle de Viagens:
// - Arrastar para o lado revela "Apagar" -> "Tem certeza?" -> apaga.
// - Toque no card abre a edição (lápis + "Toque para editar").
export function SwipeableRow({ onEdit, onDelete, deleteMessage, children }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const handleDelete = () => {
    if (!onDelete) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const msg = deleteMessage || "Tem certeza que deseja apagar este registro?";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) onDelete();
      return;
    }
    Alert.alert("Apagar", msg, [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: onDelete },
    ]);
  };

  const renderRightActions = () => (
    <Pressable style={styles.deleteAction} onPress={handleDelete} accessibilityRole="button">
      <Trash size={24} color={colors.onError} weight="bold" />
      <Text style={styles.deleteText}>Apagar</Text>
    </Pressable>
  );

  const inner = (
    <>
      {children}
      {onEdit ? (
        <View style={styles.editHint}>
          <PencilSimple size={18} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.editText}>Toque para editar</Text>
        </View>
      ) : null}
    </>
  );

  const card = onEdit ? (
    <Pressable style={styles.card} onPress={onEdit} accessibilityRole="button">
      {inner}
    </Pressable>
  ) : (
    <View style={styles.card}>{inner}</View>
  );

  if (!onDelete) return card;

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      {card}
    </ReanimatedSwipeable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  editHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  editText: { fontFamily: fonts.displaySemiBold, fontSize: 15, color: colors.brandPrimary },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    marginLeft: 10,
    borderRadius: 12,
    gap: 4,
  },
  deleteText: { fontFamily: fonts.body, fontSize: 12, fontWeight: "700", color: colors.onError },
}));
