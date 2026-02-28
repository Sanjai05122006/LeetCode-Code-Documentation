class Solution {
    public int[] minDistinctFreqPair(int[] nums) {
        int [] ans=new int []{-1,-1};
        if(nums.length<2){
            return ans;
        }
        int min=nums[0];
        int max=nums[0];
        for(int c:nums){
            if(min>c){
                min=c;
            }
            if(max<c){
                max=c;
            }
        }
        
        int [] freq=new int [max+1];
        for(int v:nums){
            freq[v]++;
        }
        
     
        
        for (int i = 0; i <= max; i++) {
            if (freq[i] == 0) continue;

            for (int j = i + 1; j <= max; j++) {
                if (freq[j] == 0) continue;

                if (freq[i] != freq[j]) {
                    return new int[]{i, j};
                }
            }
        }
        System.out.println(min);
        System.out.println(max);
        
      
        
        return ans;
    }
}