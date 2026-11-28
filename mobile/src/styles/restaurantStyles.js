import { StyleSheet, Platform } from "react-native";

const colors = {
  primary: "#269b62",
  primaryDark: "#164d35",
  primaryHover: "#1d7d4e",
  white: "#ffffff",
  black: "#222222",
  gray: "#717171",
  text: "#333333",
  textSecondary: "#777777",
  border: "#dddddd",
  background: "#f5f5f5",
  error: "#dc3545",
};

const fonts = {
  regular: "NunitoSans_400Regular",
  medium: "NunitoSans_500Medium",
  semibold: "NunitoSans_600SemiBold",
  bold: "NunitoSans_700Bold",
  extrabold: "NunitoSans_800ExtraBold",
};

const styles = StyleSheet.create({
  // Estrutura principal
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },

  loadingIndicator: {
    marginTop: 40,
  },

  // Cabeçalho com logo centralizada
  header: {
    height: 90,
    backgroundColor: colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  logo: {
    width: 170,
    height: 65,
  },

  // Área principal
  content: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.black,
    flexShrink: 1,
  },

  // Botão de cadastro
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 4,
  },

  // Listagem de restaurantes
  list: {
    flex: 1,
  },

  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },

  // Miniatura
  restaurantImage: {
    width: 66,
    height: 66,
    backgroundColor: "#e5f3eb",
    borderRadius: 8,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#d3e8dc",
  },

  restaurantInfo: {
    flex: 1,
    justifyContent: "center",
  },

  restaurantName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.black,
    marginBottom: 5,
  },

  restaurantType: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Menu de três pontos
  menuButton: {
    width: 42,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  menuText: {
    fontFamily: fonts.bold,
    fontSize: 27,
    color: colors.gray,
    lineHeight: 34,
  },

  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 45,
  },

  // Modal de cadastro / edição
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  modalContent: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "88%",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 22,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
      },
    }),
  },

  modalTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.primaryDark,
    marginBottom: 20,
  },

  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 15,
    backgroundColor: colors.white,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },

  // Ações do formulário
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    marginTop: 10,
  },

  cancelButton: {
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 7,
    backgroundColor: colors.background,
  },

  cancelText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },

  saveButton: {
    minWidth: 95,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
});

export default styles;