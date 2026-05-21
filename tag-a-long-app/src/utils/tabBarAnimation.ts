import { Animated, Easing } from 'react-native';

export const TAB_BAR_HEIGHT = 68;

export const tabBarTranslateY = new Animated.Value(0);
export const listBottomPadding = new Animated.Value(TAB_BAR_HEIGHT);

let isTabBarVisible = true;
let isAnimating = false;
let _bottomInset = 0;

export const setBottomInset = (inset: number) => {
  if (_bottomInset === inset) return;
  _bottomInset = inset;
  if (isTabBarVisible) {
    listBottomPadding.setValue(TAB_BAR_HEIGHT + inset);
  }
};

export const hideTabBar = () => {
  if (!isTabBarVisible || isAnimating) return;
  isTabBarVisible = false;
  isAnimating = true;
  Animated.parallel([
    Animated.timing(tabBarTranslateY, {
      toValue: TAB_BAR_HEIGHT + _bottomInset,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(listBottomPadding, {
      toValue: 0,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }),
  ]).start(() => { isAnimating = false; });
};

export const showTabBar = () => {
  if (isTabBarVisible || isAnimating) return;
  isTabBarVisible = true;
  isAnimating = true;
  Animated.parallel([
    Animated.timing(tabBarTranslateY, {
      toValue: 0,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(listBottomPadding, {
      toValue: TAB_BAR_HEIGHT + _bottomInset,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }),
  ]).start(() => { isAnimating = false; });
};
