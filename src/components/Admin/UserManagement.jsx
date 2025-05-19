// Добавляем импорт supabase клиента для прямого доступа к данным
import supabase from '../../services/supabaseClient';

// Добавляем функцию для принудительного обновления профиля пользователя
const refreshUserProfile = async (userId) => {
  try {
    // Получаем свежие данные из базы данных
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Ошибка при обновлении профиля пользователя:', error);
    return null;
  }
};

// В функцию загрузки пользователей добавить проверку актуальности данных
const loadUsers = async () => {
  setLoading(true);
  try {
    // Получаем список пользователей
    const users = await adminService.getUsers(pageIndex, pageSize, search);
    
    // Дополнительно обновляем профили с самыми свежими данными
    const updatedUsers = await Promise.all(
      users.data.map(async (user) => {
        const freshProfile = await refreshUserProfile(user.id);
        return freshProfile ? { ...user, ...freshProfile } : user;
      })
    );
    
    setUsers({
      ...users,
      data: updatedUsers
    });
  } catch (error) {
    console.error('Ошибка при загрузке пользователей:', error);
    setError('Не удалось загрузить список пользователей');
  } finally {
    setLoading(false);
  }
}; 