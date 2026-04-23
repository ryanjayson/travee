import React from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Text, DataTable, useTheme } from "react-native-paper";
import { TravelPlan } from "../../../../Travel/types/TravelDto";
import { useItineraryExpenses } from "../../../hooks/useExpense";

interface ExpensesTabProps {
  travelPlan: TravelPlan;
}

const ExpensesTab = ({ travelPlan }: ExpensesTabProps) => {
  const { colors } = useTheme();
  const { data: expenses, isLoading } = useItineraryExpenses(travelPlan.travel.id || "");

  if (isLoading) {
    return (
      <View className="items-center justify-center py-10">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalAmount = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  return (
    <View className="px-4 py-2">
      <View className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm mb-4">
        <DataTable>
          <DataTable.Header className="bg-gray-50/50">
            <DataTable.Title textStyle={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>Item</DataTable.Title>
            <DataTable.Title numeric textStyle={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>Date</DataTable.Title>
            <DataTable.Title numeric textStyle={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>Amount</DataTable.Title>
          </DataTable.Header>

          {expenses && expenses.length > 0 ? (
            expenses.map((expense, index) => (
              <DataTable.Row key={expense.id || index} className="border-b-0">
                <DataTable.Cell textStyle={{ fontSize: 14, fontWeight: '500', color: '#1A1A1A' }}>
                  {expense.title}
                </DataTable.Cell>
                <DataTable.Cell numeric textStyle={{ fontSize: 12, color: colors.secondary }}>
                  {new Date(expense.dateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </DataTable.Cell>
                <DataTable.Cell numeric textStyle={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  {expense.currency || '$'}{expense.amount.toFixed(2)}
                </DataTable.Cell>
              </DataTable.Row>
            ))
          ) : (
            <View className="py-10 items-center">
              <Text className="text-gray-400 text-sm">No expenses recorded for this trip.</Text>
            </View>
          )}

          {expenses && expenses.length > 0 && (
            <DataTable.Row className="bg-gray-50/30 border-t border-gray-100">
              <DataTable.Cell textStyle={{ fontWeight: '700', color: '#1A1A1A' }}>Total</DataTable.Cell>
              <DataTable.Cell />
              <DataTable.Cell numeric textStyle={{ fontWeight: '800', color: colors.primary, fontSize: 16 }}>
                ${totalAmount.toFixed(2)}
              </DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </View>
    </View>
  );
};

export default ExpensesTab;
