sed -i '129i \
  const handleRemoveItem = async (itemId: string, vId: string) => {\
    if (isSquadMode) {\
      try {\
        await api.post(`/api/squad/${squadId}/add`, {\
          foodItemId: itemId,\
          quantity: -1\
        });\
      } catch (err) {\
        console.error("Failed to remove from squad", err);\
      }\
    } else {\
      removeItem(itemId, vId);\
    }\
  };\
\
  const handleAddItem = async (item: any, vId: string) => {\
    if (isSquadMode) {\
      try {\
        await api.post(`/api/squad/${squadId}/add`, {\
          foodItemId: item.id,\
          quantity: 1\
        });\
      } catch (err) {\
        console.error("Failed to add to squad", err);\
      }\
    } else {\
      addItem(item, vId);\
    }\
  };\
' components/CartSlideOver.tsx

sed -i 's/onClick={() => removeItem(item.id, vendorId!)}/onClick={() => handleRemoveItem(item.id, vendorId!)}/g' components/CartSlideOver.tsx
sed -i 's/onClick={() => addItem(item, vendorId!)}/onClick={() => handleAddItem(item, vendorId!)}/g' components/CartSlideOver.tsx
