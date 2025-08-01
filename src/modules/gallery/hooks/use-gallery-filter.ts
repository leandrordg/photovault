import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

export const useGalleryFilters = () => {
  return useQueryStates({
    limit: parseAsInteger.withDefault(50).withOptions({ clearOnDefault: true }),
    mediaType: parseAsStringEnum(["all", "image", "video"])
      .withDefault("all")
      .withOptions({ clearOnDefault: true }),
    offset: parseAsInteger.withDefault(0).withOptions({ clearOnDefault: true }),
    showFavorites: parseAsBoolean
      .withDefault(false)
      .withOptions({ clearOnDefault: true }),
  });
};
