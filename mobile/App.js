import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from "@expo-google-fonts/nunito-sans";

import styles from "./src/styles/restaurantStyles";
import { theme } from "./src/styles/theme";
import { restaurantService } from "./src/services/restaurantService";

const EMPTY_FORM = {
  name: "",
  food_type: "",
  postal_code: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
};

const FIELDS = [
  { key: "name", label: "Nome do restaurante" },
  { key: "food_type", label: "Tipo de comida" },
  { key: "postal_code", label: "CEP", keyboardType: "numeric" },
  { key: "street", label: "Rua" },
  { key: "number", label: "Número" },
  { key: "complement", label: "Complemento (opcional)" },
  { key: "neighborhood", label: "Bairro" },
  { key: "city", label: "Cidade" },
  { key: "state", label: "UF (ex.: SP)" },
  {
    key: "latitude",
    label: "Latitude (ex.: -23.5505)",
    keyboardType: "numbers-and-punctuation",
  },
  {
    key: "longitude",
    label: "Longitude (ex.: -46.6333)",
    keyboardType: "numbers-and-punctuation",
  },
];

export default function App() {
  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  const [restaurantes, setRestaurantes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const carregarRestaurantes = useCallback(async (refresh = false) => {
    if (refresh) setAtualizando(true);
    else setCarregando(true);

    try {
      const dados = await restaurantService.listar();
      setRestaurantes(dados);
    } catch (error) {
      Alert.alert("Erro ao carregar", error.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarRestaurantes();
  }, [carregarRestaurantes]);

  function alterarCampo(campo, valor) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function abrirCadastro() {
    setEditandoId(null);
    setForm({ ...EMPTY_FORM });
    setModalVisible(true);
  }

  function abrirEdicao(restaurante) {
    setEditandoId(restaurante.id);

    const dados = {};
    Object.keys(EMPTY_FORM).forEach((campo) => {
      dados[campo] = String(restaurante[campo] ?? "");
    });

    setForm(dados);
    setModalVisible(true);
  }

  function validarFormulario() {
    const obrigatorios = FIELDS.filter(
      (campo) => campo.key !== "complement"
    );

    const faltando = obrigatorios.find(
      (campo) => !form[campo.key].trim()
    );

    if (faltando) {
      Alert.alert(
        "Campo obrigatório",
        `Preencha: ${faltando.label}`
      );
      return false;
    }

    if (!/^[A-Za-z]{2}$/.test(form.state.trim())) {
      Alert.alert("UF inválida", "Informe duas letras, como SP.");
      return false;
    }

    const latitude = Number(form.latitude.replace(",", "."));
    const longitude = Number(form.longitude.replace(",", "."));

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      Alert.alert(
        "Coordenadas inválidas",
        "Informe latitude entre -90 e 90 e longitude entre -180 e 180."
      );
      return false;
    }

    return true;
  }

  async function salvarRestaurante() {
    if (salvando || !validarFormulario()) return;

    const dados = {
      ...form,
      name: form.name.trim(),
      food_type: form.food_type.trim(),
      postal_code: form.postal_code.trim(),
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      latitude: Number(form.latitude.replace(",", ".")),
      longitude: Number(form.longitude.replace(",", ".")),
    };

    setSalvando(true);

    try {
      if (editandoId !== null) {
        await restaurantService.atualizar(editandoId, dados);
      } else {
        await restaurantService.cadastrar(dados);
      }

      setModalVisible(false);
      setEditandoId(null);

      await carregarRestaurantes();

      Alert.alert(
        "Sucesso",
        editandoId !== null
          ? "Restaurante atualizado com sucesso."
          : "Restaurante cadastrado com sucesso."
      );
    } catch (error) {
      Alert.alert("Erro ao salvar", error.message);
    } finally {
      setSalvando(false);
    }
  }

  function excluirRestaurante(restaurante) {
    Alert.alert(
      "Excluir restaurante",
      `Deseja excluir "${restaurante.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await restaurantService.excluir(restaurante.id);
              await carregarRestaurantes();
              Alert.alert(
                "Sucesso",
                "Restaurante excluído com sucesso."
              );
            } catch (error) {
              Alert.alert("Erro ao excluir", error.message);
            }
          },
        },
      ]
    );
  }

  function abrirMenu(restaurante) {
    Alert.alert(restaurante.name, "Selecione uma ação:", [
      {
        text: "Editar",
        onPress: () => abrirEdicao(restaurante),
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => excluirRestaurante(restaurante),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.white}
      />

      <View style={styles.header}>
        <Image
          source={require(
            "./assets/images/foodify-logo-green.png"
          )}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Restaurantes</Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={abrirCadastro}
          >
            <Text style={styles.createButtonText}>
              + Criar novo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {carregando ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.loadingIndicator}
          />
        ) : (
          <FlatList
            style={styles.list}
            data={restaurantes}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={() => carregarRestaurantes(true)}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                Nenhum restaurante cadastrado.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.restaurantRow}>
                <View style={styles.restaurantImage} />

                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>
                    {item.name}
                  </Text>

                  <Text style={styles.restaurantType}>
                    {item.food_type}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => abrirMenu(item)}
                >
                  <Text style={styles.menuText}>⋮</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!salvando) setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editandoId !== null
                ? "Editar Restaurante"
                : "Novo Restaurante"}
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {FIELDS.map((campo) => (
                <View key={campo.key}>
                  <Text style={styles.fieldLabel}>
                    {campo.label}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder={campo.label}
                    placeholderTextColor={theme.colors.gray}
                    value={form[campo.key]}
                    onChangeText={(valor) =>
                      alterarCampo(campo.key, valor)
                    }
                    keyboardType={campo.keyboardType || "default"}
                    autoCapitalize={
                      campo.key === "state"
                        ? "characters"
                        : "sentences"
                    }
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                disabled={salvando}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                disabled={salvando}
                onPress={salvarRestaurante}
              >
                {salvando ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}