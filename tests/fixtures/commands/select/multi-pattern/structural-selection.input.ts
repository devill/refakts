/**
 * @description Test structural selection with related elements
 * @command refakts select structural-selection.input.ts --structural --regex ".*[Uu]ser.*" --include-methods --include-fields
 */

class UserService {
    private userData: any;
    private userCache: Map<string, any>;
    
    getUserById(id: string) {
        return this.userData[id];
    }
    
    updateUserData(id: string, data: any) {
        this.userData[id] = data;
        this.userCache.set(id, data);
    }
    
    clearUserCache() {
        this.userCache.clear();
    }
    
    private fetchUserFromAPI(id: string) {
        return fetch(`/api/users/${id}`);
    }
}